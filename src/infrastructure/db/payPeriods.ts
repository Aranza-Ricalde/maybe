import { asc, eq } from "drizzle-orm";
import type { PayPeriodRecord, PayPeriodsRepository } from "@/domain/payPeriod/ports";
import { db } from "./client";
import { payPeriods } from "./schema/payPeriods";

export class DrizzlePayPeriodsRepository implements PayPeriodsRepository {
  async listForFamily(familyId: number): Promise<PayPeriodRecord[]> {
    return db.select().from(payPeriods).where(eq(payPeriods.familyId, familyId)).orderBy(asc(payPeriods.start));
  }

  async getById(id: number): Promise<PayPeriodRecord | null> {
    const [row] = await db.select().from(payPeriods).where(eq(payPeriods.id, id));
    return row ?? null;
  }

  async create(familyId: number, start: string, end: string): Promise<PayPeriodRecord> {
    const [row] = await db.insert(payPeriods).values({ familyId, start, end }).returning();
    return row;
  }

  async createMissing(familyId: number, ranges: Array<{ start: string; end: string }>): Promise<void> {
    if (ranges.length === 0) return;
    await db.insert(payPeriods).values(ranges.map(({ start, end }) => ({ familyId, start, end }))).onConflictDoNothing();
  }

  async update(id: number, start: string, end: string): Promise<void> {
    await db.update(payPeriods).set({ start, end }).where(eq(payPeriods.id, id));
  }

  async delete(id: number): Promise<void> {
    await db.delete(payPeriods).where(eq(payPeriods.id, id));
  }
}
