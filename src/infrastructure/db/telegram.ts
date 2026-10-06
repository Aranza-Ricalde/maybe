import { and, asc, eq, ilike, isNotNull } from "drizzle-orm";
import type { ResolvedAccount, TelegramLinkedUser, TelegramRepository } from "@/domain/telegram/ports";
import { db } from "./client";
import { accounts } from "./schema/accounts";
import { users } from "./schema/core";

const escapeLike = (text: string) => text.replace(/[\\%_]/g, "\\$&");

function toLinkedUser(row: typeof users.$inferSelect): TelegramLinkedUser {
  return { id: row.id, familyId: row.familyId, name: row.name };
}

export class DrizzleTelegramRepository implements TelegramRepository {
  async findUserByChatId(chatId: string): Promise<TelegramLinkedUser | null> {
    const [row] = await db.select().from(users).where(eq(users.telegramChatId, chatId)).limit(1);
    return row ? toLinkedUser(row) : null;
  }

  async findAnyLinkedUser(): Promise<TelegramLinkedUser | null> {
    const [row] = await db.select().from(users).where(isNotNull(users.telegramChatId)).limit(1);
    return row ? toLinkedUser(row) : null;
  }

  async findFirstUser(): Promise<TelegramLinkedUser | null> {
    const [row] = await db.select().from(users).orderBy(asc(users.id)).limit(1);
    return row ? toLinkedUser(row) : null;
  }

  async linkChatId(userId: number, chatId: string): Promise<void> {
    await db.update(users).set({ telegramChatId: chatId }).where(eq(users.id, userId));
  }

  async listAccountNames(familyId: number): Promise<string[]> {
    const rows = await db.select({ name: accounts.name }).from(accounts).where(and(eq(accounts.familyId, familyId), eq(accounts.isActive, true))).orderBy(asc(accounts.id));
    return rows.map((row) => row.name);
  }

  async resolveAccount(familyId: number, hint: string | undefined): Promise<ResolvedAccount | null> {
    if (hint) {
      const [row] = await db
        .select({ id: accounts.id, name: accounts.name })
        .from(accounts)
        .where(and(eq(accounts.familyId, familyId), eq(accounts.isActive, true), ilike(accounts.name, `%${escapeLike(hint)}%`)))
        .limit(1);
      return row ?? null;
    }
    const [row] = await db
      .select({ id: accounts.id, name: accounts.name })
      .from(accounts)
      .where(and(eq(accounts.familyId, familyId), eq(accounts.isActive, true)))
      .orderBy(asc(accounts.id))
      .limit(1);
    return row ?? null;
  }
}
