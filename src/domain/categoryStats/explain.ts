import { endOfMonth } from "@/domain/cashflow/rules";
import { UNCATEGORIZED_ID, UNKNOWN_CATEGORY_ID, type CategoryStats } from "./rules";
import { groupBy } from "@/domain/shared/collections";
import { transactionsDrilldownHref } from "@/domain/shared/routes";

export const MAX_ROOT_NODES = 6;
export const MAX_CHILD_NODES = 4;

export interface ChangeNode {
  categoryId: number | null;
  name: string;
  lastCents: number;
  previousCents: number;
  deltaCents: number;
  href?: string;
  children: ChangeNode[];
}

export interface ChangeExplanation {
  month: string;
  previousMonth: string;
  lastTotalCents: number;
  previousTotalCents: number;
  totalDeltaCents: number;
  nodes: ChangeNode[];
}

const hasChange = (n: { deltaCents: number }) => n.deltaCents !== 0;
const byImpact = (a: ChangeNode, b: ChangeNode) => Math.abs(b.deltaCents) - Math.abs(a.deltaCents) || b.lastCents - a.lastCents;

function hrefFor(categoryId: number, month: string): string | undefined {
  return categoryId > 0 ? transactionsDrilldownHref(categoryId, month, endOfMonth(month)) : undefined;
}

export function explainChange(stats: CategoryStats): ChangeExplanation | null {
  if (stats.completedMonths.length < 2) return null;
  const month = stats.completedMonths[stats.completedMonths.length - 1];
  const previousMonth = stats.completedMonths[stats.completedMonths.length - 2];

  const childRows = stats.rows.filter((r) => r.depth === 1 && r.parentId != null);
  const childrenOf = groupBy(
    childRows.map((row) => ({
      parentId: row.parentId as number,
      node: {
        categoryId: row.categoryId,
        name: row.name,
        lastCents: row.lastMonthCents,
        previousCents: row.previousMonthCents,
        deltaCents: row.deltaCents,
        href: hrefFor(row.categoryId, month),
        children: [],
      } satisfies ChangeNode,
    })),
    (entry) => entry.parentId,
  );

  const roots: ChangeNode[] = stats.rows
    .filter((r) => r.depth === 0)
    .map((row) => {
      const all = (childrenOf.get(row.categoryId) ?? []).map((entry) => entry.node).filter(hasChange).sort(byImpact);
      const shown = all.slice(0, MAX_CHILD_NODES);
      const restDelta = row.deltaCents - shown.reduce((s, c) => s + c.deltaCents, 0);
      const restLast = row.lastMonthCents - shown.reduce((s, c) => s + c.lastCents, 0);
      const restPrevious = row.previousMonthCents - shown.reduce((s, c) => s + c.previousCents, 0);
      const children = shown.length > 0 && restDelta !== 0 ? [...shown, { categoryId: null, name: "Otros", lastCents: restLast, previousCents: restPrevious, deltaCents: restDelta, children: [] }] : shown;
      return {
        categoryId: row.categoryId,
        name: row.name,
        lastCents: row.lastMonthCents,
        previousCents: row.previousMonthCents,
        deltaCents: row.deltaCents,
        href: row.categoryId === UNCATEGORIZED_ID || row.categoryId === UNKNOWN_CATEGORY_ID ? undefined : hrefFor(row.categoryId, month),
        children,
      };
    })
    .filter(hasChange)
    .sort(byImpact);

  const shownRoots = roots.slice(0, MAX_ROOT_NODES);
  const rest = roots.slice(MAX_ROOT_NODES);
  const nodes =
    rest.length > 0
      ? [
          ...shownRoots,
          {
            categoryId: null,
            name: "Otras categorías",
            lastCents: rest.reduce((s, n) => s + n.lastCents, 0),
            previousCents: rest.reduce((s, n) => s + n.previousCents, 0),
            deltaCents: rest.reduce((s, n) => s + n.deltaCents, 0),
            children: [],
          },
        ]
      : shownRoots;

  return {
    month,
    previousMonth,
    lastTotalCents: stats.totals.lastMonthCents,
    previousTotalCents: stats.totals.previousMonthCents,
    totalDeltaCents: stats.totals.deltaCents,
    nodes,
  };
}
