import { eq } from "drizzle-orm";
import type { ProfileReader } from "@/domain/readModels/ports";
import { db } from "../client";
import { users } from "../schema/core";

export class DrizzleProfileReader implements ProfileReader {
  async profile(userId: number) {
    const [row] = await db.select({ email: users.email, telegramChatId: users.telegramChatId }).from(users).where(eq(users.id, userId));
    return row ?? null;
  }
}
