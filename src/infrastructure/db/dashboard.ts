import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import type { AccountType } from "@/domain/accounts/rules";
import type {
  AccountBalance,
  CreditCardAccount,
  DailyBalancePoint,
  DailyFlowPoint,
  DashboardRepository,
  MonthlyFlow,
  MonthlyFlowPoint,
} from "@/domain/dashboard/ports";
import { accountBalancesDaily, accounts } from "./schema/accounts";
import { balancesAsOfByAccount, dailyTotalBalanceSeries, sumBalanceAsOf } from "./balances";
import { db } from "./client";
import { incomeExpenseMonthly } from "./schema/aggregates";

const LIQUID_TYPES: AccountType[] = ["checking", "cash"];
const SAVINGS_TYPES: AccountType[] = ["savings"];
const ASSET_TYPES: AccountType[] = ["checking", "savings", "cash", "property", "vehicle", "other_asset"];
const OTHER_LIABILITY_TYPES: AccountType[] = ["loan", "other_liability"];

interface CreditCardDetails {
  creditLimitCents?: number;
}

export class DrizzleDashboardRepository implements DashboardRepository {
  private async accountsByType(familyId: number, types: AccountType[]) {
    return db
      .select()
      .from(accounts)
      .where(and(eq(accounts.familyId, familyId), inArray(accounts.type, types), eq(accounts.isActive, true)));
  }

  private async withBalances(rows: (typeof accounts.$inferSelect)[], asOfDate: string): Promise<AccountBalance[]> {
    const balances = await balancesAsOfByAccount(rows.map((r) => r.id), asOfDate);
    return rows.map((r) => ({ accountId: r.id, name: r.name, type: r.type, balanceCents: balances.get(r.id) ?? 0 }));
  }

  async getLiquidAccounts(familyId: number, asOfDate: string): Promise<AccountBalance[]> {
    return this.withBalances(await this.accountsByType(familyId, LIQUID_TYPES), asOfDate);
  }

  async getSavingsAccounts(familyId: number, asOfDate: string): Promise<AccountBalance[]> {
    return this.withBalances(await this.accountsByType(familyId, SAVINGS_TYPES), asOfDate);
  }

  async getAssetAccounts(familyId: number, asOfDate: string): Promise<AccountBalance[]> {
    return this.withBalances(await this.accountsByType(familyId, ASSET_TYPES), asOfDate);
  }

  async getCreditCardAccounts(familyId: number, asOfDate: string): Promise<CreditCardAccount[]> {
    const rows = await this.accountsByType(familyId, ["credit_card"]);
    const balances = await balancesAsOfByAccount(rows.map((r) => r.id), asOfDate);
    return rows.map((r) => {
      const details = (r.details as CreditCardDetails | null) ?? {};
      return {
        accountId: r.id,
        name: r.name,
        type: r.type,
        balanceCents: balances.get(r.id) ?? 0,
        creditLimitCents: details.creditLimitCents ?? null,
      };
    });
  }

  async getOtherLiabilityAccounts(familyId: number, asOfDate: string): Promise<AccountBalance[]> {
    return this.withBalances(await this.accountsByType(familyId, OTHER_LIABILITY_TYPES), asOfDate);
  }

  async getEarliestBalance(accountId: number): Promise<number> {
    const [row] = await db
      .select({ balanceCents: accountBalancesDaily.balanceCents })
      .from(accountBalancesDaily)
      .where(eq(accountBalancesDaily.accountId, accountId))
      .orderBy(asc(accountBalancesDaily.date))
      .limit(1);
    return row?.balanceCents ?? 0;
  }

  async getBalanceAt(accountIds: number[], date: string): Promise<number> {
    return sumBalanceAsOf(accountIds, date);
  }

  async getFlowForDateRange(familyId: number, fromDate: string, toDateInclusive: string): Promise<MonthlyFlow> {
    const [row] = await db.execute<{ income_cents: string; expense_cents: string }>(sql`
      SELECT
        COALESCE(SUM(CASE WHEN t.amount_cents > 0 THEN t.amount_cents ELSE 0 END), 0)::bigint AS income_cents,
        COALESCE(SUM(CASE WHEN t.amount_cents < 0 THEN t.amount_cents ELSE 0 END), 0)::bigint AS expense_cents
      FROM transactions t
      INNER JOIN accounts a ON a.id = t.account_id
      WHERE a.family_id = ${familyId}
        AND t.kind NOT IN ('transfer', 'loan_payment', 'cc_payment')
        AND t.date >= ${fromDate}::date
        AND t.date <= ${toDateInclusive}::date
    `).then((r) => r.rows);
    return { incomeCents: Number(row?.income_cents ?? 0), expenseCents: Number(row?.expense_cents ?? 0) };
  }

  async getDailyBalanceSeries(accountIds: number[], fromDate: string, toDateInclusive: string): Promise<DailyBalancePoint[]> {
    return dailyTotalBalanceSeries(accountIds, fromDate, toDateInclusive);
  }

  async getMonthlyFlowRange(familyId: number, fromMonthInclusive: string, toMonthInclusive: string): Promise<MonthlyFlowPoint[]> {
    const rows = await db
      .select()
      .from(incomeExpenseMonthly)
      .where(
        and(
          eq(incomeExpenseMonthly.familyId, familyId),
          gte(incomeExpenseMonthly.month, fromMonthInclusive),
          lte(incomeExpenseMonthly.month, toMonthInclusive),
        ),
      )
      .orderBy(incomeExpenseMonthly.month);
    return rows.map((r) => ({ month: r.month, incomeCents: r.incomeCents, expenseCents: r.expenseCents }));
  }

  async getDailyFlow(familyId: number, fromDate: string, toDateInclusive: string): Promise<DailyFlowPoint[]> {
    const result = await db.execute<{ date: string; income_cents: string; expense_cents: string }>(sql`
      SELECT gs.day::date AS date,
        COALESCE(SUM(CASE WHEN t.amount_cents > 0 THEN t.amount_cents ELSE 0 END), 0)::bigint AS income_cents,
        COALESCE(SUM(CASE WHEN t.amount_cents < 0 THEN t.amount_cents ELSE 0 END), 0)::bigint AS expense_cents
      FROM generate_series(${fromDate}::date, ${toDateInclusive}::date, interval '1 day') AS gs(day)
      LEFT JOIN transactions t
        ON t.date = gs.day
        AND t.kind NOT IN ('transfer', 'loan_payment', 'cc_payment')
        AND t.account_id IN (SELECT id FROM accounts WHERE family_id = ${familyId})
      GROUP BY gs.day
      ORDER BY gs.day
    `);
    return result.rows.map((row) => ({
      date: row.date,
      incomeCents: Number(row.income_cents),
      expenseCents: Number(row.expense_cents),
    }));
  }
}
