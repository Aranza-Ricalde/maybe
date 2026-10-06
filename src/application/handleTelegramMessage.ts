import { InvalidCaptureError } from "@/domain/captures/rules";
import { decodeCallback } from "@/domain/telegram/callbacks";
import { parseBotCommand, recentCount } from "@/domain/telegram/commands";
import { CATEGORY_BUTTONS_LIMIT, HELP_TEXT, captureCardButtons, captureCardText, categoryButtons } from "@/domain/telegram/messages";
import type { TelegramRepository, TelegramSender } from "@/domain/telegram/ports";
import { TelegramDateError, TelegramParseError, parseTelegramMessage, splitAccountHint, UNRECOGNIZED_MESSAGE_HELP } from "@/domain/telegram/rules";
import type { AnswerTelegramQueryUseCase } from "./answerTelegramQuery";
import type { CaptureMovementResult, CaptureMovementUseCase } from "./captureMovement";
import { todayIso } from "@/lib/today";
import { UnreadableNotificationError, type CaptureNotificationUseCase } from "./captureNotification";
import type { CorrectCaptureUseCase } from "./correctCapture";

const UNKNOWN_CHAT_MESSAGE = "No reconozco este chat. Manda /link primero para vincularlo.";

export class HandleTelegramMessageUseCase {
  constructor(
    private readonly repo: TelegramRepository,
    private readonly capture: CaptureMovementUseCase,
    private readonly notification: CaptureNotificationUseCase,
    private readonly correct: CorrectCaptureUseCase,
    private readonly queries: AnswerTelegramQueryUseCase,
    private readonly sender: TelegramSender,
  ) {}

  async execute(chatId: string, text: string): Promise<void> {
    const user = await this.repo.findUserByChatId(chatId);
    if (!user) return this.sender.sendMessage(chatId, UNKNOWN_CHAT_MESSAGE);

    const command = parseBotCommand(text);
    if (command) return this.sender.sendMessage(chatId, await this.answerCommand(user.familyId, command.name, command.argument));

    const { text: body, accountHint } = splitAccountHint(text);
    const account = await this.repo.resolveAccount(user.familyId, accountHint);
    if (!account) return this.sender.sendMessage(chatId, await this.accountNotFoundMessage(user.familyId, accountHint));

    try {
      const result = await this.record(user.familyId, account.id, body);
      if (!result) return this.sender.sendMessage(chatId, `⚠️ ${UNRECOGNIZED_MESSAGE_HELP}`);
      const card = await this.correct.find(user.familyId, result.transactionId);
      const suggestions = card.needsConfirmation && card.categoryId == null ? await this.correct.suggestedCategories(user.familyId, card.transactionId, CATEGORY_BUTTONS_LIMIT) : [];
      await this.sender.sendMessage(chatId, captureCardText(card), captureCardButtons(card, suggestions));
    } catch (error) {
      await this.sender.sendMessage(chatId, `⚠️ No se pudo registrar: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async handleCallback(chatId: string, callbackId: string, messageId: number, data: string): Promise<void> {
    const user = await this.repo.findUserByChatId(chatId);
    const action = user ? decodeCallback(data) : null;
    if (!user || !action) return this.sender.answerCallback(callbackId, user ? "Acción no válida." : UNKNOWN_CHAT_MESSAGE);

    try {
      const { familyId } = user;
      const { transactionId } = action;
      if (action.action === "undo") {
        const view = await this.correct.undo(familyId, transactionId);
        await this.sender.editMessage(chatId, messageId, captureCardText(view, "↩️ Deshecho: ya no está registrado."));
      } else if (action.action === "change") {
        const view = await this.correct.find(familyId, transactionId);
        const categories = await this.correct.suggestedCategories(familyId, transactionId, CATEGORY_BUTTONS_LIMIT);
        await this.sender.editMessage(chatId, messageId, captureCardText(view, "Elige la categoría:"), categoryButtons(transactionId, categories));
      } else {
        const view = action.action === "cat" ? await this.correct.setCategory(familyId, transactionId, action.categoryId ?? 0) : await this.correct.confirm(familyId, transactionId);
        await this.sender.editMessage(chatId, messageId, captureCardText(view, action.action === "cat" ? "✅ Categoría actualizada." : "✅ Confirmado."), captureCardButtons(view, []));
      }
      await this.sender.answerCallback(callbackId);
    } catch (error) {
      await this.sender.answerCallback(callbackId, error instanceof InvalidCaptureError ? error.message : "No se pudo completar la acción.");
      if (!(error instanceof InvalidCaptureError)) throw error;
    }
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

  private async accountNotFoundMessage(familyId: number, accountHint: string | undefined): Promise<string> {
    const names = await this.repo.listAccountNames(familyId);
    if (names.length === 0) return "Todavía no tienes ninguna cuenta — crea una en la app primero.";
    return `No encontré una cuenta que coincida con "#${accountHint}". Tus cuentas: ${names.join(", ")}.`;
  }

  private async record(familyId: number, accountId: number, text: string): Promise<CaptureMovementResult | null> {
    try {
      const parsed = parseTelegramMessage(text, todayIso());
      return await this.capture.execute({ familyId, account: { id: accountId }, type: parsed.amountCents < 0 ? "expense" : "income", amountCents: Math.abs(parsed.amountCents), description: parsed.description, date: parsed.date, source: "telegram" });
    } catch (error) {
      if (!(error instanceof TelegramParseError) || error instanceof TelegramDateError) throw error;
    }
    try {
      return await this.notification.execute(familyId, { id: accountId }, text, "telegram");
    } catch (error) {
      if (error instanceof UnreadableNotificationError) return null;
      throw error;
    }
  }
}
