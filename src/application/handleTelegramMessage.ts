import type { TelegramRepository, TelegramSender } from "@/domain/telegram/ports";
import { TelegramParseError, parseTelegramMessage } from "@/domain/telegram/rules";
import type { RecordTransactionUseCase } from "./recordTransaction";

export class HandleTelegramMessageUseCase {
  constructor(
    private readonly repo: TelegramRepository,
    private readonly recordTransaction: RecordTransactionUseCase,
    private readonly sender: TelegramSender,
  ) {}

  async execute(chatId: string, text: string): Promise<void> {
    const user = await this.repo.findUserByChatId(chatId);
    if (!user) {
      await this.sender.sendMessage(chatId, "No reconozco este chat. Manda /link primero para vincularlo.");
      return;
    }

    let parsed;
    try {
      parsed = parseTelegramMessage(text);
    } catch (err) {
      if (err instanceof TelegramParseError) {
        await this.sender.sendMessage(chatId, `⚠️ ${err.message}`);
        return;
      }
      throw err;
    }

    const account = await this.repo.resolveAccount(user.familyId, parsed.accountHint);
    if (!account) {
      await this.sender.sendMessage(
        chatId,
        parsed.accountHint ? `No encontré una cuenta que coincida con "#${parsed.accountHint}".` : "Todavía no tienes ninguna cuenta — crea una en la app primero.",
      );
      return;
    }

    try {
      await this.recordTransaction.execute({
        accountId: account.id,
        date: new Date().toISOString().slice(0, 10),
        amountCents: parsed.amountCents,
        name: parsed.description,
        source: "telegram",
      });
      const sign = parsed.amountCents >= 0 ? "+" : "-";
      const formatted = (Math.abs(parsed.amountCents) / 100).toFixed(2);
      await this.sender.sendMessage(chatId, `✅ Registrado: ${sign}$${formatted} "${parsed.description}" en ${account.name}`);
    } catch (err) {
      await this.sender.sendMessage(chatId, `⚠️ No se pudo registrar: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
