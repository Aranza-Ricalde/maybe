import type { TelegramSender } from "@/domain/telegram/ports";

export class TelegramApiSender implements TelegramSender {
  constructor(private readonly botToken: string = requireBotToken()) {}

  async sendMessage(chatId: string, text: string): Promise<void> {
    const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!response.ok) {
      throw new Error(`Telegram sendMessage respondió ${response.status}: ${await response.text()}`);
    }
  }
}

function requireBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN no está definida (ver .env.example)");
  return token;
}
