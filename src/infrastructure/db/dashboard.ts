import { NON_FLOW_KINDS } from "@/domain/ledger/rules";
import { sql } from "drizzle-orm";
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
import { activeAccountsOf, balancesOfActiveAccounts, type AccountRow } from "./accountsContext";
import { balancesAsOfByAccount, dailyTotalBalanceSeries, earliestBalances, sumBalanceAsOf, sumBalancesAtDates } from "./balances";
import { db } from "./client";

const LIQUID_TYPES: AccountType[] = ["checking", "debit_card", "cash"];
const SAVINGS_TYPES: AccountType[] = ["savings"];
const ASSET_TYPES: AccountType[] = ["checking", "debit_card", "savings", "cash", "property", "vehicle", "other_asset"];
const OTHER_LIABILITY_TYPES: AccountType[] = ["loan", "other_liability"];

interface CreditCardDetails {
  creditLimitCents?: number;
}

const NON_FLOW_SQL = sql.join(NON_FLOW_KINDS.map((k) => sql`${k}`), sql`, `);

export class DrizzleDashboardRepository implements DashboardRepository {
  private async accountsByType(familyId: number, types: AccountType[]) {
    const wanted = new Set<string>(types);
    return (await activeAccountsOf(familyId)).filter((row) => wanted.has(row.type));
  }

  private async withBalances(familyId: number, rows: AccountRow[], asOfDate: string): Promise<AccountBalance[]> {
    const balances = await balancesOfActiveAccounts(familyId, asOfDate);
    return rows.map((r) => ({ accountId: r.id, name: r.name, type: r.type, balanceCents: balances.get(r.id) ?? 0 }));
  }

  async getLiquidAccounts(familyId: number, asOfDate: string): Promise<AccountBalance[]> {
    return this.withBalances(familyId, await this.accountsByType(familyId, LIQUID_TYPES), asOfDate);
  }

  async getSavingsAccounts(familyId: number, asOfDate: string): Promise<AccountBalance[]> {
    return this.withBalances(familyId, await this.accountsByType(familyId, SAVINGS_TYPES), asOfDate);
  }

  async getAssetAccounts(familyId: number, asOfDate: string): Promise<AccountBalance[]> {
    return this.withBalances(familyId, await this.accountsByType(familyId, ASSET_TYPES), asOfDate);
  }

  async getCreditCardAccounts(familyId: number, asOfDate: string): Promise<CreditCardAccount[]> {
    const rows = await this.accountsByType(familyId, ["credit_card"]);
    const balances = await balancesOfActiveAccounts(familyId, asOfDate);
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
    return this.withBalances(familyId, await this.accountsByType(familyId, OTHER_LIABILITY_TYPES), asOfDate);
  }

  async getEarliestBalances(accountIds: number[]): Promise<number[]> {
    return earliestBalances(accountIds);
  }

  async getBalancesAtDates(accountIds: number[], dates: string[]): Promise<number[]> {
    return sumBalancesAtDates(accountIds, dates);
  }

  async getPaymentsInto(accountIds: number[], fromDate: string, toDateInclusive: string): Promise<number> {
    if (accountIds.length === 0) return 0;
    const result = await db.execute<{ total: string | null }>(sql`
      SELECT COALESCE(SUM(t.amount_cents), 0)::bigint AS total
      FROM transactions t
      WHERE t.account_id IN (${sql.join(accountIds.map((id) => sql`${id}`), sql`, `)})
        AND t.amount_cents > 0
        AND t.kind <> 'adjustment'
        AND t.date >= ${fromDate}::date
        AND t.date <= ${toDateInclusive}::date
    `);
    return Number(result.rows[0]?.total ?? 0);
  }

  async getOpeningBalancesAfter(accountIds: number[], date: string): Promise<number> {
    if (accountIds.length === 0) return 0;
    const result = await db.execute<{ total: string | null }>(sql`
      SELECT COALESCE(SUM(first.balance_cents), 0)::bigint AS total
      FROM (
        SELECT DISTINCT ON (account_id) account_id, date, balance_cents
        FROM account_balances_daily
        WHERE account_id IN (${sql.join(accountIds.map((id) => sql`${id}`), sql`, `)})
        ORDER BY account_id, date ASC
      ) first
      WHERE first.date > ${date}::date
    `);
    return Number(result.rows[0]?.total ?? 0);
  }

  async getBalanceAt(accountIds: number[], date: string): Promise<number> {
    return sumBalanceAsOf(accountIds, date);
  }

  async getBalancesByAccount(accountIds: number[], date: string): Promise<Map<number, number>> {
    return balancesAsOfByAccount(accountIds, date);
  }

  async getFlowForDateRange(familyId: number, fromDate: string, toDateInclusive: string): Promise<MonthlyFlow> {
    const [row] = await db.execute<{ income_cents: string; expense_cents: string }>(sql`
      SELECT
        COALESCE(SUM(CASE WHEN t.amount_cents > 0 THEN t.amount_cents ELSE 0 END), 0)::bigint AS income_cents,
        COALESCE(SUM(CASE WHEN t.amount_cents < 0 THEN t.amount_cents ELSE 0 END), 0)::bigint AS expense_cents
      FROM transactions t
      INNER JOIN accounts a ON a.id = t.account_id
      WHERE a.family_id = ${familyId}
        AND t.kind NOT IN (${NON_FLOW_SQL})
        AND t.date >= ${fromDate}::date
        AND t.date <= ${toDateInclusive}::date
    `).then((r) => r.rows);
    return { incomeCents: Number(row?.income_cents ?? 0), expenseCents: Number(row?.expense_cents ?? 0) };
  }

  async getDailyBalanceSeries(accountIds: number[], fromDate: string, toDateInclusive: string): Promise<DailyBalancePoint[]> {
    return dailyTotalBalanceSeries(accountIds, fromDate, toDateInclusive);
  }

  async getMonthlyFlowRange(familyId: number, fromMonthInclusive: string, toMonthInclusive: string): Promise<MonthlyFlowPoint[]> {
    const result = await db.execute<{ month: string; income_cents: string; expense_cents: string }>(sql`
      SELECT to_char(date_trunc('month', t.date), 'YYYY-MM-DD') AS month,
        COALESCE(SUM(CASE WHEN t.amount_cents > 0 THEN t.amount_cents ELSE 0 END), 0)::bigint AS income_cents,
        COALESCE(SUM(CASE WHEN t.amount_cents < 0 THEN t.amount_cents ELSE 0 END), 0)::bigint AS expense_cents
      FROM transactions t
      INNER JOIN accounts a ON a.id = t.account_id
      WHERE a.family_id = ${familyId}
        AND t.kind NOT IN (${NON_FLOW_SQL})
        AND date_trunc('month', t.date) >= ${fromMonthInclusive}::date
        AND date_trunc('month', t.date) <= ${toMonthInclusive}::date
      GROUP BY 1
      ORDER BY 1
    `);
    return result.rows.map((r) => ({ month: r.month, incomeCents: Number(r.income_cents), expenseCents: Number(r.expense_cents) }));
  }

  async getDailyFlow(familyId: number, fromDate: string, toDateInclusive: string): Promise<DailyFlowPoint[]> {
    const result = await db.execute<{ date: string; income_cents: string; expense_cents: string }>(sql`
      SELECT to_char(gs.day::date, 'YYYY-MM-DD') AS date,
        COALESCE(SUM(CASE WHEN t.amount_cents > 0 THEN t.amount_cents ELSE 0 END), 0)::bigint AS income_cents,
        COALESCE(SUM(CASE WHEN t.amount_cents < 0 THEN t.amount_cents ELSE 0 END), 0)::bigint AS expense_cents
      FROM generate_series(${fromDate}::date, ${toDateInclusive}::date, interval '1 day') AS gs(day)
      LEFT JOIN transactions t
        ON t.date = gs.day
        AND t.kind NOT IN (${NON_FLOW_SQL})
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
