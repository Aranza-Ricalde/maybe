import { and, eq, lt, sql } from "drizzle-orm";
import type { MovementDraft, TelegramDraftRepository } from "@/domain/telegram/ports";
import { DRAFT_TTL_HOURS } from "@/domain/telegram/rules";
import { db } from "./client";
import { telegramDrafts } from "./schema/telegram";

export class DrizzleTelegramDraftRepository implements TelegramDraftRepository {
  async create(draft: MovementDraft): Promise<number> {
    await db.delete(telegramDrafts).where(lt(telegramDrafts.createdAt, sql`now() - make_interval(hours => ${DRAFT_TTL_HOURS})`));
    const [row] = await db
      .insert(telegramDrafts)
      .values({ chatId: draft.chatId, familyId: draft.familyId, type: draft.type, amountCents: draft.amountCents, description: draft.description, date: draft.date ?? null, notes: draft.notes ?? null })
      .returning({ id: telegramDrafts.id });
    return row.id;
  }

  async take(chatId: string, id: number): Promise<MovementDraft | null> {
    const [row] = await db
      .delete(telegramDrafts)
      .where(and(eq(telegramDrafts.id, id), eq(telegramDrafts.chatId, chatId), sql`${telegramDrafts.createdAt} >= now() - make_interval(hours => ${DRAFT_TTL_HOURS})`))
      .returning();
    return row ? { chatId: row.chatId, familyId: row.familyId, type: row.type, amountCents: row.amountCents, description: row.description, ...(row.date ? { date: row.date } : {}), ...(row.notes ? { notes: row.notes } : {}) } : null;
  }
}
