import { eq } from "drizzle-orm";
import { perRequest } from "../requestScope";
import { balancesAsOfByAccount } from "./balances";
import { db } from "./client";
import { accounts } from "./schema/accounts";

export type AccountRow = typeof accounts.$inferSelect;

export const activeAccountsOf = perRequest(async (familyId: number): Promise<AccountRow[]> => {
  const rows = await db.select().from(accounts).where(eq(accounts.familyId, familyId));
  return rows.filter((row) => row.isActive);
});

export const balancesOfActiveAccounts = perRequest(async (familyId: number, asOfDate: string): Promise<Map<number, number>> => {
  const rows = await activeAccountsOf(familyId);
  return balancesAsOfByAccount(rows.map((row) => row.id), asOfDate);
});
