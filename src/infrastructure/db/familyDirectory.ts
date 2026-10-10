import { asc } from "drizzle-orm";
import type { AuthenticatedUser } from "@/domain/auth/ports";
import type { FamilyDirectory } from "@/domain/notifications/ports";
import { db } from "./client";
import { users } from "./schema/core";

export class DrizzleFamilyDirectory implements FamilyDirectory {
  async listFamilyUsers(): Promise<AuthenticatedUser[]> {
    const rows = await db.select().from(users).orderBy(asc(users.id));
    return rows.map((row) => ({ id: row.id, familyId: row.familyId, email: row.email, name: row.name }));
  }
}
