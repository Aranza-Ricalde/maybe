import type { TelegramButton, TelegramSender } from "@/domain/telegram/ports";

const REQUEST_TIMEOUT_MS = 8000;

const keyboard = (buttons?: TelegramButton[][]) =>
  buttons && buttons.length > 0 ? { reply_markup: { inline_keyboard: buttons.map((row) => row.map(({ text, data }) => ({ text, callback_data: data }))) } } : {};

export class TelegramApiSender implements TelegramSender {
  constructor(private readonly botToken: string = requireBotToken()) {}

  async sendMessage(chatId: string, text: string, buttons?: TelegramButton[][], options?: { html?: boolean }): Promise<void> {
    await this.call("sendMessage", { chat_id: chatId, text, ...(options?.html ? { parse_mode: "HTML" } : {}), ...keyboard(buttons) });
  }

  async editMessage(chatId: string, messageId: number, text: string, buttons?: TelegramButton[][]): Promise<void> {
    await this.call("editMessageText", { chat_id: chatId, message_id: messageId, text, ...keyboard(buttons) });
  }

  async answerCallback(callbackId: string, text?: string): Promise<void> {
    await this.call("answerCallbackQuery", { callback_query_id: callbackId, ...(text ? { text } : {}) });
  }

  private async call(method: string, body: Record<string, unknown>): Promise<void> {
    const response = await fetch(`https://api.telegram.org/bot${this.botToken}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Telegram ${method} respondió ${response.status}: ${await response.text()}`);
  }
}

function requireBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN no está definida (ver .env.example)");
  return token;
}
