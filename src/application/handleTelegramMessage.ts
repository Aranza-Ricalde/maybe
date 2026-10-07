import { InvalidCaptureError } from "@/domain/captures/rules";
import { inferAccountFromText } from "@/domain/telegram/accountInference";
import { decodeCallback, type BotCallback } from "@/domain/telegram/callbacks";
import { parseBotCommand, recentCount } from "@/domain/telegram/commands";
import { CATEGORY_BUTTONS_LIMIT, HELP_TEXT, accountButtons, accountQuestionText, captureCardButtons, captureCardText, categoryButtons, categoryMenuButtons, categoryMenuTitle } from "@/domain/telegram/messages";
import type { MovementDraft, TelegramDraftRepository, TelegramRepository, TelegramSender } from "@/domain/telegram/ports";
import { TelegramDateError, TelegramParseError, UNRECOGNIZED_MESSAGE_HELP, parseTelegramMessage, splitAccountHint } from "@/domain/telegram/rules";
import { todayIso } from "@/lib/today";
import type { AnswerTelegramQueryUseCase } from "./answerTelegramQuery";
import type { CaptureMovementResult, CaptureMovementUseCase } from "./captureMovement";
import type { CaptureNotificationUseCase, InterpretedMovement } from "./captureNotification";
import type { CorrectCaptureUseCase } from "./correctCapture";

const UNKNOWN_CHAT_MESSAGE = "No reconozco este chat. Manda /link primero para vincularlo.";
const NO_ACCOUNTS_MESSAGE = "Todavía no tienes ninguna cuenta — crea una en la app primero.";
const EXPIRED_DRAFT_MESSAGE = "Esto ya expiró o ya se registró. Mándalo de nuevo.";

export class HandleTelegramMessageUseCase {
  constructor(
    private readonly repo: TelegramRepository,
    private readonly capture: CaptureMovementUseCase,
    private readonly notification: CaptureNotificationUseCase,
    private readonly correct: CorrectCaptureUseCase,
    private readonly queries: AnswerTelegramQueryUseCase,
    private readonly drafts: TelegramDraftRepository,
    private readonly sender: TelegramSender,
  ) {}

  async execute(chatId: string, text: string): Promise<void> {
    const user = await this.repo.findUserByChatId(chatId);
    if (!user) return this.sender.sendMessage(chatId, UNKNOWN_CHAT_MESSAGE);

    const command = parseBotCommand(text);
    if (command) return this.sender.sendMessage(chatId, await this.answerCommand(user.familyId, command.name, command.argument));

    const { text: body, accountHint } = splitAccountHint(text);
    try {
      const movement = await this.interpret(body);
      if (!movement) return this.sender.sendMessage(chatId, `⚠️ ${UNRECOGNIZED_MESSAGE_HELP}`);

      const accounts = await this.repo.listAccounts(user.familyId);
      if (accounts.length === 0) return this.sender.sendMessage(chatId, NO_ACCOUNTS_MESSAGE);

      const account = accountHint ? await this.repo.resolveAccount(user.familyId, accountHint) : inferAccountFromText(body, accounts);
      if (accountHint && !account) {
        return this.sender.sendMessage(chatId, `No encontré una cuenta que coincida con "#${accountHint}". Tus cuentas: ${accounts.map((a) => a.name).join(", ")}.`);
      }
      if (!account) {
        const draftId = await this.drafts.create({ chatId, familyId: user.familyId, ...movement });
        const lastUsed = await this.repo.lastUsedAccountId(user.familyId);
        return this.sender.sendMessage(chatId, accountQuestionText(movement), accountButtons(draftId, accounts, lastUsed));
      }
      await this.register(chatId, user.familyId, account.id, movement);
    } catch (error) {
      await this.sender.sendMessage(chatId, `⚠️ No se pudo registrar: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async handleCallback(chatId: string, callbackId: string, messageId: number, data: string): Promise<void> {
    const user = await this.repo.findUserByChatId(chatId);
    const action = user ? decodeCallback(data) : null;
    if (!user || !action) return this.sender.answerCallback(callbackId, user ? "Acción no válida." : UNKNOWN_CHAT_MESSAGE);

    try {
      await this.dispatch(chatId, messageId, user.familyId, action);
      await this.sender.answerCallback(callbackId);
    } catch (error) {
      await this.sender.answerCallback(callbackId, error instanceof InvalidCaptureError ? error.message : "No se pudo completar la acción.");
      if (!(error instanceof InvalidCaptureError)) throw error;
    }
  }

  private async dispatch(chatId: string, messageId: number, familyId: number, callback: BotCallback): Promise<void> {
    const { id } = callback;
    switch (callback.action) {
      case "acct": {
        const draft = await this.drafts.take(chatId, id);
        if (!draft || draft.familyId !== familyId) throw new InvalidCaptureError(EXPIRED_DRAFT_MESSAGE);
        return this.register(chatId, familyId, callback.arg ?? 0, draft, messageId);
      }
      case "cancel": {
        await this.drafts.take(chatId, id);
        return this.sender.editMessage(chatId, messageId, "✖️ Cancelado: no se registró nada.");
      }
      case "undo": {
        const view = await this.correct.undo(familyId, id);
        return this.sender.editMessage(chatId, messageId, captureCardText(view, "↩️ Deshecho: ya no está registrado."));
      }
      case "change": {
        const view = await this.correct.find(familyId, id);
        const categories = await this.correct.suggestedCategories(familyId, id, CATEGORY_BUTTONS_LIMIT);
        return this.sender.editMessage(chatId, messageId, captureCardText(view, "Elige la categoría:"), categoryButtons(id, categories));
      }
      case "nav": {
        const { view, menu } = await this.correct.categoryMenu(familyId, id, callback.arg ?? 0, callback.page ?? 0);
        return this.sender.editMessage(chatId, messageId, captureCardText(view, categoryMenuTitle(menu)), categoryMenuButtons(id, menu));
      }
      default: {
        const view = callback.action === "cat" ? await this.correct.setCategory(familyId, id, callback.arg ?? 0) : await this.correct.confirm(familyId, id);
        return this.sender.editMessage(chatId, messageId, captureCardText(view, callback.action === "cat" ? "✅ Categoría actualizada." : "✅ Confirmado."), captureCardButtons(view, []));
      }
    }
  }

  private async register(chatId: string, familyId: number, accountId: number, movement: InterpretedMovement | MovementDraft, messageId?: number): Promise<void> {
    const { type, amountCents, description, date, notes } = movement;
    const result: CaptureMovementResult = await this.capture.execute({ familyId, account: { id: accountId }, type, amountCents, description, date, notes, source: "telegram" });
    const card = await this.correct.find(familyId, result.transactionId);
    const suggestions = card.needsConfirmation && card.categoryId == null ? await this.correct.suggestedCategories(familyId, card.transactionId, CATEGORY_BUTTONS_LIMIT) : [];
    const buttons = captureCardButtons(card, suggestions);
    if (messageId != null) await this.sender.editMessage(chatId, messageId, captureCardText(card), buttons);
    else await this.sender.sendMessage(chatId, captureCardText(card), buttons);
  }

  private async interpret(text: string): Promise<InterpretedMovement | null> {
    try {
      const parsed = parseTelegramMessage(text, todayIso());
      return { type: parsed.amountCents < 0 ? "expense" : "income", amountCents: Math.abs(parsed.amountCents), description: parsed.description, ...(parsed.date ? { date: parsed.date } : {}) };
    } catch (error) {
      if (!(error instanceof TelegramParseError) || error instanceof TelegramDateError) throw error;
    }
    return this.notification.interpret(text);
  }

  private async answerCommand(familyId: number, name: string, argument: string): Promise<string> {
    const today = todayIso();
    switch (name) {
      case "saldo":
        return this.queries.balances(familyId, today, argument);
      case "ultimos":
        return this.queries.recent(familyId, recentCount(argument));
      case "resumen":
        return this.queries.summary(familyId, today);
      default:
        return HELP_TEXT;
    }
  }
}
