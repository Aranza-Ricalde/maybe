import { shiftMonth } from "@/domain/dashboard/rules";
import { isIdentifiableMerchant } from "@/domain/merchants/resolver";
import { monthStart } from "@/domain/ledger/rules";
import type { InsightExpense } from "@/domain/insights/rules";

export const SMALL_EXPENSE_MAX_CENTS = 15_000;
export const MAX_SMALL_GROUPS = 6;
export const MAX_MERCHANTS = 8;
export const MERCHANT_MONTHS = 3;

export interface SmallExpenseGroup {
  name: string;
  count: number;
  totalCents: number;
}

export interface SmallExpenseSummary {
  month: string;
  totalCents: number;
  count: number;
  shareOfSpend: number;
  groups: SmallExpenseGroup[];
  previousTotalCents: number | null;
}

export function smallExpenseSummary(expenses: InsightExpense[], today: string): SmallExpenseSummary | null {
  const month = shiftMonth(monthStart(today), -1);
  const previousMonth = shiftMonth(month, -1);
  const inMonth = (e: InsightExpense, m: string) => e.date.slice(0, 7) === m.slice(0, 7);
  const isSmall = (e: InsightExpense) => e.amountCents < 0 && e.amountCents >= -SMALL_EXPENSE_MAX_CENTS;

  const monthExpenses = expenses.filter((e) => inMonth(e, month));
  const small = monthExpenses.filter(isSmall);
  if (small.length === 0) return null;

  const byName = new Map<string, SmallExpenseGroup>();
  for (const e of small) {
    const name = e.categoryName ?? "Sin categoría";
    const group = byName.get(name) ?? { name, count: 0, totalCents: 0 };
    group.count += 1;
    group.totalCents += Math.abs(e.amountCents);
    byName.set(name, group);
  }
  const sorted = [...byName.values()].sort((a, b) => b.totalCents - a.totalCents || a.name.localeCompare(b.name));
  const shown = sorted.slice(0, MAX_SMALL_GROUPS);
  const rest = sorted.slice(MAX_SMALL_GROUPS);
  const groups = rest.length > 0 ? [...shown, { name: "Otros", count: rest.reduce((s, g) => s + g.count, 0), totalCents: rest.reduce((s, g) => s + g.totalCents, 0) }] : shown;

  const totalCents = small.reduce((s, e) => s + Math.abs(e.amountCents), 0);
  const monthSpend = monthExpenses.reduce((s, e) => s + Math.abs(e.amountCents), 0);
  const previousSmall = expenses.filter((e) => inMonth(e, previousMonth) && isSmall(e));

  return {
    month,
    totalCents,
    count: small.length,
    shareOfSpend: monthSpend > 0 ? totalCents / monthSpend : 0,
    groups,
    previousTotalCents: previousSmall.length > 0 ? previousSmall.reduce((s, e) => s + Math.abs(e.amountCents), 0) : null,
  };
}

export interface MerchantSpendRow {
  merchant: string;
  identified: boolean;
  categoryId: number | null;
  month: string;
  totalCents: number;
  count: number;
}

export interface MerchantRank {
  merchant: string;
  totalCents: number;
  count: number;
  shareOfSpend: number;
}

export interface UnidentifiedSpend {
  totalCents: number;
  count: number;
  shareOfSpend: number;
}

export interface MerchantRanking {
  ranked: MerchantRank[];
  unidentified: UnidentifiedSpend | null;
}

export function rankMerchants(rows: MerchantSpendRow[], limit: number = MAX_MERCHANTS): MerchantRanking {
  const total = rows.reduce((sum, r) => sum + r.totalCents, 0);
  const isMerchant = (r: MerchantSpendRow) => r.identified && isIdentifiableMerchant(r.merchant);

  const byMerchant = new Map<string, { totalCents: number; count: number }>();
  for (const r of rows.filter(isMerchant)) {
    const cur = byMerchant.get(r.merchant) ?? { totalCents: 0, count: 0 };
    cur.totalCents += r.totalCents;
    cur.count += r.count;
    byMerchant.set(r.merchant, cur);
  }
  const ranked = [...byMerchant.entries()]
    .map(([merchant, v]) => ({ merchant, ...v, shareOfSpend: total > 0 ? v.totalCents / total : 0 }))
    .sort((a, b) => b.totalCents - a.totalCents || a.merchant.localeCompare(b.merchant))
    .slice(0, limit);

  const rest = rows.filter((r) => !isMerchant(r));
  const restTotal = rest.reduce((sum, r) => sum + r.totalCents, 0);
  const unidentified = rest.length > 0 ? { totalCents: restTotal, count: rest.reduce((sum, r) => sum + r.count, 0), shareOfSpend: total > 0 ? restTotal / total : 0 } : null;
  return { ranked, unidentified };
}
