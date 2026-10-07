import { eq } from "drizzle-orm";
import type { PeriodViewRepository } from "@/domain/payPeriod/ports";
import type { FamilySettingsRepository } from "@/domain/settings/ports";
import { db } from "./client";
import { familySettings } from "./schema/settings";

const UNDEFINED_TABLE = "42P01";

function isUndefinedTable(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code === UNDEFINED_TABLE || e?.cause?.code === UNDEFINED_TABLE;
}

export class DrizzleFamilySettingsRepository implements FamilySettingsRepository, PeriodViewRepository {
  async getMinimumBalanceCents(familyId: number): Promise<number | null> {
    try {
      const [row] = await db.select({ cents: familySettings.minimumBalanceCents }).from(familySettings).where(eq(familySettings.familyId, familyId));
      return row?.cents ?? null;
    } catch (error) {
      if (isUndefinedTable(error)) return null;
      throw error;
    }
  }

  async setMinimumBalanceCents(familyId: number, cents: number | null): Promise<void> {
    await db
      .insert(familySettings)
      .values({ familyId, minimumBalanceCents: cents })
      .onConflictDoUpdate({ target: familySettings.familyId, set: { minimumBalanceCents: cents, updatedAt: new Date() } });
  }

  async get(familyId: number): Promise<string | null> {
    const [row] = await db.select({ view: familySettings.periodView }).from(familySettings).where(eq(familySettings.familyId, familyId));
    return row?.view ?? null;
  }

  async set(familyId: number, view: string): Promise<void> {
    await db
      .insert(familySettings)
      .values({ familyId, periodView: view })
      .onConflictDoUpdate({ target: familySettings.familyId, set: { periodView: view, updatedAt: new Date() } });
  }
}
