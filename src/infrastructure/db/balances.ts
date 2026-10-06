import { sql } from "drizzle-orm";
import { db } from "./client";

export async function sumBalanceAsOf(accountIds: number[], asOfDate: string): Promise<number> {
  if (accountIds.length === 0) return 0;

  const result = await db.execute<{ total: string }>(sql`
    SELECT COALESCE(SUM(balance_cents), 0)::bigint AS total FROM (
      SELECT DISTINCT ON (account_id) account_id, balance_cents
      FROM account_balances_daily
      WHERE account_id IN ${accountIds} AND date <= ${asOfDate}
      ORDER BY account_id, date DESC
    ) latest
  `);
  return Number(result.rows[0]?.total ?? 0);
}

export async function balancesAsOfByAccount(accountIds: number[], asOfDate: string): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  if (accountIds.length === 0) return map;

  const result = await db.execute<{ account_id: number; balance_cents: string }>(sql`
    SELECT DISTINCT ON (account_id) account_id, balance_cents
    FROM account_balances_daily
    WHERE account_id IN ${accountIds} AND date <= ${asOfDate}
    ORDER BY account_id, date DESC
  `);
  for (const row of result.rows) {
    map.set(Number(row.account_id), Number(row.balance_cents));
  }
  return map;
}

export async function dailyTotalBalanceSeries(
  accountIds: number[],
  fromDate: string,
  toDateInclusive: string,
): Promise<Array<{ date: string; balanceCents: number }>> {
  if (accountIds.length === 0) return [];

  const result = await db.execute<{ date: string; total: string }>(sql`
    SELECT gs.day::date AS date, COALESCE(SUM(latest.balance_cents), 0)::bigint AS total
    FROM generate_series(${fromDate}::date, ${toDateInclusive}::date, interval '1 day') AS gs(day)
    CROSS JOIN (SELECT DISTINCT account_id FROM account_balances_daily WHERE account_id IN ${accountIds}) accts
    LEFT JOIN LATERAL (
      SELECT balance_cents
      FROM account_balances_daily
      WHERE account_id = accts.account_id AND date <= gs.day
      ORDER BY date DESC
      LIMIT 1
    ) latest ON true
    GROUP BY gs.day
    ORDER BY gs.day
  `);
  return result.rows.map((row) => ({ date: row.date, balanceCents: Number(row.total) }));
}

export async function sumBalancesAtDates(accountIds: number[], dates: string[]): Promise<number[]> {
  if (dates.length === 0) return [];
  if (accountIds.length === 0) return dates.map(() => 0);

  const dateRows = sql.join(dates.map((date, index) => sql`(${index}::int, ${date}::date)`), sql`, `);
  const result = await db.execute<{ position: number; total: string }>(sql`
    SELECT d.position, COALESCE(SUM(latest.balance_cents), 0)::bigint AS total
    FROM (VALUES ${dateRows}) AS d(position, day)
    CROSS JOIN (SELECT DISTINCT account_id FROM account_balances_daily WHERE account_id IN ${accountIds}) accts
    LEFT JOIN LATERAL (
      SELECT balance_cents
      FROM account_balances_daily
      WHERE account_id = accts.account_id AND date <= d.day
      ORDER BY date DESC
      LIMIT 1
    ) latest ON true
    GROUP BY d.position
  `);
  const totals = new Map(result.rows.map((row) => [Number(row.position), Number(row.total)]));
  return dates.map((_, index) => totals.get(index) ?? 0);
}

export async function earliestBalances(accountIds: number[]): Promise<number[]> {
  if (accountIds.length === 0) return [];
  const result = await db.execute<{ account_id: number; balance_cents: string }>(sql`
    SELECT DISTINCT ON (account_id) account_id, balance_cents
    FROM account_balances_daily
    WHERE account_id IN ${accountIds}
    ORDER BY account_id, date ASC
  `);
  const byAccount = new Map(result.rows.map((row) => [Number(row.account_id), Number(row.balance_cents)]));
  return accountIds.map((id) => byAccount.get(id) ?? 0);
}
