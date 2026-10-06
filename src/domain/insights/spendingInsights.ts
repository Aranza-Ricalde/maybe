import { groupBy } from "@/domain/shared/collections";
import { DUPLICATE_LOOKBACK_DAYS, DUPLICATE_MIN_CENTS, DUPLICATE_WINDOW_DAYS, Insight, SIMILAR_AMOUNT_RATIO, UNUSUAL_HISTORY_DAYS, UNUSUAL_MIN_CENTS, UNUSUAL_MIN_HISTORY, UNUSUAL_MULTIPLE, UNUSUAL_RECENT_DAYS } from "./model";
import { daysBetween, drilldown, pesos, shortDate } from "./format";
import { ROUTES } from "@/domain/shared/routes";

export interface InsightExpense {
  id: number;
  date: string;
  name: string;
  amountCents: number;
  accountId: number;
  categoryId: number | null;
  categoryName: string | null;
}

const normalizeName = (name: string) => name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]+/g, " ").trim();

export function duplicateInsights(expenses: InsightExpense[], today: string): Insight[] {
  const recent = expenses
    .filter((e) => e.amountCents <= -DUPLICATE_MIN_CENTS && daysBetween(e.date, today) <= DUPLICATE_LOOKBACK_DAYS)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  const keyOf = new Map(recent.map((e) => [e.id, `${e.accountId}|${e.amountCents}|${normalizeName(e.name)}`]));
  const sameExpense = groupBy(recent, (e) => keyOf.get(e.id));
  const positionInGroup = new Map<number, number>();
  for (const group of sameExpense.values()) group.forEach((e, position) => positionInGroup.set(e.id, position));

  const used = new Set<number>();
  const insights: Insight[] = [];

  for (const a of recent) {
    if (used.has(a.id)) continue;
    const later = (sameExpense.get(keyOf.get(a.id)) ?? []).slice((positionInGroup.get(a.id) ?? 0) + 1);
    const b = later.find((c) => !used.has(c.id) && daysBetween(a.date, c.date) <= DUPLICATE_WINDOW_DAYS);
    if (!b) continue;
    used.add(a.id);
    used.add(b.id);
    insights.push({
      id: `duplicate-${a.id}-${b.id}`,
      tone: "attention",
      message: `Posible gasto duplicado: “${a.name}” por ${pesos(a.amountCents)} aparece dos veces (${shortDate(a.date)} y ${shortDate(b.date)})`,
      href: ROUTES.transactions,
      weight: Math.abs(a.amountCents),
    });
  }
  return insights.sort((x, y) => y.weight - x.weight);
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export function unusualExpenseInsights(expenses: InsightExpense[], today: string): Insight[] {
  const byCategory = groupBy(expenses.filter((e) => e.categoryId != null), (e) => e.categoryId);
  const byName = groupBy(expenses, (e) => normalizeName(e.name));
  const insights: Insight[] = [];
  for (const e of expenses) {
    if (e.categoryId == null || e.amountCents > -UNUSUAL_MIN_CENTS || daysBetween(e.date, today) > UNUSUAL_RECENT_DAYS) continue;
    const history = (byCategory.get(e.categoryId) ?? []).filter((h) => h.id !== e.id && h.date < e.date && daysBetween(h.date, e.date) <= UNUSUAL_HISTORY_DAYS);
    if (history.length < UNUSUAL_MIN_HISTORY) continue;
    const habitual = (byName.get(normalizeName(e.name)) ?? []).some(
      (h) => h.id !== e.id && daysBetween(h.date, e.date) <= UNUSUAL_HISTORY_DAYS && Math.abs(h.amountCents) >= Math.abs(e.amountCents) * SIMILAR_AMOUNT_RATIO,
    );
    if (habitual) continue;
    const usual = median(history.map((h) => Math.abs(h.amountCents)));
    if (usual <= 0 || Math.abs(e.amountCents) < usual * UNUSUAL_MULTIPLE) continue;
    insights.push({
      id: `unusual-${e.id}`,
      tone: "change",
      message: `Gasto inusualmente alto: “${e.name}” por ${pesos(e.amountCents)} en ${e.categoryName}`,
      detail: `Lo habitual en esa categoría ronda ${pesos(usual)} por movimiento.`,
      href: e.categoryId != null ? drilldown(e.categoryId, e.date, e.date) : ROUTES.transactions,
      weight: Math.abs(e.amountCents) / usual,
    });
  }
  return insights.sort((a, b) => b.weight - a.weight);
}
