import { lt } from "drizzle-orm";
import type { ProcessedUpdatesStore } from "@/domain/telegram/ports";
import { db } from "@/infrastructure/db/client";
import { telegramProcessedUpdates } from "@/infrastructure/db/schema/telegram";
import { logFailure } from "@/lib/log";

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export class DrizzleProcessedUpdates implements ProcessedUpdatesStore {
  async markIfNew(updateId: number): Promise<boolean> {
    try {
      const inserted = await db.insert(telegramProcessedUpdates).values({ updateId }).onConflictDoNothing().returning({ updateId: telegramProcessedUpdates.updateId });
      if (inserted.length === 0) return false;
      await db.delete(telegramProcessedUpdates).where(lt(telegramProcessedUpdates.processedAt, new Date(Date.now() - RETENTION_MS)));
      return true;
    } catch (error) {
      logFailure("No se pudo registrar el update de Telegram; se procesa de todos modos", error);
      return true;
    }
  }
}
