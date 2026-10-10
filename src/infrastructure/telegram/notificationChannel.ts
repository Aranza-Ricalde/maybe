import { and, eq, isNotNull } from "drizzle-orm";
import type { NotificationChannel } from "@/domain/notifications/ports";
import type { NotificationKind } from "@/domain/notifications/rules";
import { telegramHtml } from "@/domain/notifications/rules";
import type { TelegramSender } from "@/domain/telegram/ports";
import { db } from "@/infrastructure/db/client";
import { users } from "@/infrastructure/db/schema/core";

export class TelegramNotificationChannel implements NotificationChannel {
  constructor(private readonly sender: TelegramSender) {}

  async deliver(familyId: number, notification: { kind: NotificationKind; title: string; body: string }): Promise<void> {
    const linked = await db.select({ chatId: users.telegramChatId }).from(users).where(and(eq(users.familyId, familyId), isNotNull(users.telegramChatId)));
    const chatIds = [...new Set(linked.flatMap((row) => (row.chatId ? [row.chatId] : [])))];
    await Promise.all(chatIds.map((chatId) => this.sender.sendMessage(chatId, telegramHtml(notification), undefined, { html: true })));
  }
}
