import { count, eq } from "drizzle-orm";
import type { AccountRecord, AccountsRepository, NewAccountInput } from "@/domain/accounts/ports";
import type { AccountType } from "@/domain/accounts/rules";
import { db } from "./client";
import { accounts } from "./schema/accounts";
import { transactions, valuations } from "./schema/transactions";

export class DrizzleAccountsRepository implements AccountsRepository {
  async getById(id: number): Promise<AccountRecord | null> {
    const [row] = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
    return row ? { ...row, details: row.details as Record<string, unknown> | null } : null;
  }

  async getActivityCount(id: number): Promise<number> {
    const [txRow] = await db.select({ n: count() }).from(transactions).where(eq(transactions.accountId, id));
    const [valRow] = await db.select({ n: count() }).from(valuations).where(eq(valuations.accountId, id));
    return (txRow?.n ?? 0) + (valRow?.n ?? 0);
  }

  async create(input: NewAccountInput): Promise<void> {
    const details = input.creditLimitCents != null ? { creditLimitCents: input.creditLimitCents } : undefined;
    await db.insert(accounts).values({ familyId: input.familyId, name: input.name, type: input.type, details });
  }

  async update(id: number, fields: { name: string; type: AccountType; details: Record<string, unknown> | null }): Promise<void> {
    await db.update(accounts).set({ ...fields, updatedAt: new Date() }).where(eq(accounts.id, id));
  }

  async archive(id: number): Promise<void> {
    await db.update(accounts).set({ isActive: false, updatedAt: new Date() }).where(eq(accounts.id, id));
  }

  async delete(id: number): Promise<void> {
    await db.delete(accounts).where(eq(accounts.id, id));
  }

  async restore(id: number): Promise<void> {
    await db.update(accounts).set({ isActive: true, updatedAt: new Date() }).where(eq(accounts.id, id));
  }
}
