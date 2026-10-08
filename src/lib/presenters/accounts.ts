import type { AccountsBalanceHistory } from "@/application/getAccountsBalanceHistory";
import { isLiabilityAccountType, type AccountType } from "@/domain/accounts/rules";
import type { EvolutionPoint } from "@/domain/evolution/rules";

export type AccountGroupKey = "liquid" | "credit" | "loans";

export const ACCOUNT_GROUP_LABELS: Record<AccountGroupKey, string> = { liquid: "Efectivo, ahorro y activos", credit: "Tarjetas de crédito", loans: "Préstamos y otros pasivos" };
const GROUP_ORDER: AccountGroupKey[] = ["liquid", "credit", "loans"];

export function accountGroupOf(type: AccountType): AccountGroupKey {
  if (type === "credit_card") return "credit";
  return isLiabilityAccountType(type) ? "loans" : "liquid";
}

export function groupAccounts<T extends { type: AccountType }>(rows: T[]): Array<{ key: AccountGroupKey; label: string; rows: T[] }> {
  return GROUP_ORDER.map((key) => ({ key, label: ACCOUNT_GROUP_LABELS[key], rows: rows.filter((row) => accountGroupOf(row.type) === key) })).filter((group) => group.rows.length > 0);
}

const keyOf = (accountId: number) => `a${accountId}`;

export function accountSpark(history: AccountsBalanceHistory, accountId: number): number[] {
  const values = history.points.map((point) => point[keyOf(accountId)]).filter((value): value is number => typeof value === "number");
  return new Set(values).size > 1 ? values : [];
}

export function accountSeries(history: AccountsBalanceHistory, accountId: number): EvolutionPoint[] {
  return history.points.flatMap((point) => {
    const value = point[keyOf(accountId)];
    return typeof value === "number" ? [{ date: String(point.date), value }] : [];
  });
}

export function paymentDayLabel(paymentDueDay: number | null): string | null {
  return paymentDueDay == null ? null : `Paga el día ${paymentDueDay}`;
}

export function accountChange(history: AccountsBalanceHistory, accountId: number): number | null {
  const series = accountSeries(history, accountId);
  if (series.length < 2) return null;
  return series[series.length - 1].value - series[0].value;
}

export function accountChangeView(history: AccountsBalanceHistory, accountId: number): { cents: number; pct: number | null } | null {
  const series = accountSeries(history, accountId);
  if (series.length < 2) return null;
  const first = series[0].value;
  const cents = series[series.length - 1].value - first;
  return { cents, pct: first === 0 ? null : cents / Math.abs(first) };
}

export const ACCOUNT_FILTERS = [
  { value: "all", label: "Todas" },
  { value: "liquid", label: "Efectivo y débito" },
  { value: "credit", label: "Crédito" },
  { value: "loans", label: "Préstamos" },
] as const;
export type AccountFilter = (typeof ACCOUNT_FILTERS)[number]["value"];

export function filterAccounts<T extends { type: AccountType }>(rows: T[], filter: AccountFilter): T[] {
  return filter === "all" ? rows : rows.filter((row) => accountGroupOf(row.type) === filter);
}
