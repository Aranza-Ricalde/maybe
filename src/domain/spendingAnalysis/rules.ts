import { shiftMonth } from "@/domain/dashboard/rules";
import { isIdentifiableMerchant } from "@/domain/merchants/resolver";
import { monthStart } from "@/domain/ledger/rules";
import type { InsightExpense } from "@/domain/insights/rules";

export const SMALL_EXPENSE_MAX_CENTS = 15_000;
export const MAX_SMALL_GROUPS = 6;
export const MAX_MERCHANTS = 8;
export const MERCHANT_MONTHS = 3;
export const SUBSCRIPTION_CATEGORY_NAMES = ["suscripciones", "suscripciones y streaming", "streaming"];

const normalize = (name: string) => name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

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
  categoryId: number | null;
  totalCents: number;
  count: number;
}

export interface MerchantRank {
  merchant: string;
  totalCents: number;
  count: number;
  shareOfSpend: number;
}

export function rankMerchants(rows: MerchantSpendRow[], limit: number = MAX_MERCHANTS): MerchantRank[] {
  const byMerchant = new Map<string, { totalCents: number; count: number }>();
  for (const r of rows) {
    const cur = byMerchant.get(r.merchant) ?? { totalCents: 0, count: 0 };
    cur.totalCents += r.totalCents;
    cur.count += r.count;
    byMerchant.set(r.merchant, cur);
  }
  const total = [...byMerchant.values()].reduce((s, m) => s + m.totalCents, 0);
  return [...byMerchant.entries()]
    .filter(([merchant]) => isIdentifiableMerchant(merchant))
    .map(([merchant, v]) => ({ merchant, ...v, shareOfSpend: total > 0 ? v.totalCents / total : 0 }))
    .sort((a, b) => b.totalCents - a.totalCents || a.merchant.localeCompare(b.merchant))
    .slice(0, limit);
}

export interface SubscriptionCategory {
  id: number;
  name: string;
  parentId: number | null;
}

export function subscriptionCategoryIds(categories: SubscriptionCategory[]): Set<number> {
  const roots = new Set(categories.filter((c) => SUBSCRIPTION_CATEGORY_NAMES.includes(normalize(c.name))).map((c) => c.id));
  return new Set(categories.filter((c) => roots.has(c.id) || (c.parentId != null && roots.has(c.parentId))).map((c) => c.id));
}

export interface SubscriptionSummary {
  monthlyCents: number;
  yearlyCents: number;
  services: Array<{ merchant: string; monthlyCents: number }>;
}

export function subscriptionSummary(rows: MerchantSpendRow[], subscriptionIds: Set<number>, monthsCount: number): SubscriptionSummary | null {
  if (monthsCount <= 0) return null;
  const mine = rows.filter((r) => r.categoryId != null && subscriptionIds.has(r.categoryId));
  if (mine.length === 0) return null;
  const byMerchant = new Map<string, number>();
  for (const r of mine) byMerchant.set(r.merchant, (byMerchant.get(r.merchant) ?? 0) + r.totalCents);
  const services = [...byMerchant.entries()]
    .map(([merchant, total]) => ({ merchant, monthlyCents: Math.round(total / monthsCount) }))
    .sort((a, b) => b.monthlyCents - a.monthlyCents);
  const monthlyCents = services.reduce((s, x) => s + x.monthlyCents, 0);
  return { monthlyCents, yearlyCents: monthlyCents * 12, services };
}
