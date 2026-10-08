import { useMemo, useState } from "react";
import { areAllExpanded, parentIds, toggleExpanded, visibleBudgetRows, type BudgetTreeRow, type VisibleBudgetRow } from "@/lib/presenters/budgetTree";

export interface BudgetTree<T extends BudgetTreeRow> {
  visibleRows: VisibleBudgetRow<T>[];
  hasParents: boolean;
  allExpanded: boolean;
  toggle: (categoryId: number) => void;
  toggleAll: () => void;
}

export function useBudgetTree<T extends BudgetTreeRow>(rows: T[]): BudgetTree<T> {
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set());
  const visibleRows = useMemo(() => visibleBudgetRows(rows, expanded), [rows, expanded]);
  const allExpanded = areAllExpanded(rows, expanded);

  return {
    visibleRows,
    hasParents: parentIds(rows).length > 0,
    allExpanded,
    toggle: (categoryId) => setExpanded((current) => toggleExpanded(current, categoryId)),
    toggleAll: () => setExpanded(allExpanded ? new Set() : new Set(parentIds(rows))),
  };
}
