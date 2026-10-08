import { classifyBudgetProgress, computeBudgetPercent, type BudgetProgressTone } from "@/domain/budget/rules";
import { sortBudgetRows, type BudgetTreeRow } from "./budgetTree";

export function clampPercent(percent: number): number {
  return Math.max(0, Math.min(100, percent));
}

export interface BudgetLineStatus {
  ratio: number | null;
  ringPercent: number;
  barValue: number;
  tone: BudgetProgressTone | null;
  over: boolean;
  leftCents: number;
}

export function budgetLineStatus(effectiveBudgetedCents: number, actualCents: number): BudgetLineStatus {
  const ratio = computeBudgetPercent(effectiveBudgetedCents, actualCents);
  return {
    ratio,
    ringPercent: ratio === null ? 0 : ratio * 100,
    barValue: ratio === null ? 0 : clampPercent(ratio * 100),
    tone: ratio === null ? null : classifyBudgetProgress(ratio),
    over: ratio !== null && ratio > 1,
    leftCents: effectiveBudgetedCents - Math.abs(actualCents),
  };
}

export interface BudgetGroups<T extends BudgetTreeRow> {
  budgeted: T[];
  unbudgeted: T[];
  childrenOf: (categoryId: number) => T[];
}

export function groupBudgetRows<T extends BudgetTreeRow>(rows: T[]): BudgetGroups<T> {
  const sorted = sortBudgetRows(rows);
  const parents = sorted.filter((row) => row.parentId == null);
  return {
    budgeted: parents.filter((row) => row.effectiveBudgetedCents > 0),
    unbudgeted: parents.filter((row) => row.effectiveBudgetedCents <= 0),
    childrenOf: (categoryId) => sorted.filter((row) => row.parentId === categoryId),
  };
}

export interface BudgetSummaryView {
  ringPercent: number;
  remainingCents: number;
  over: boolean;
}

export function budgetSummaryView(budgetedCents: number, spentCents: number): BudgetSummaryView {
  const remainingCents = budgetedCents - spentCents;
  return { ringPercent: budgetedCents > 0 ? (spentCents / budgetedCents) * 100 : 0, remainingCents, over: remainingCents < 0 };
}

export function coverageProgress(months: number, targetMonths: number): number {
  return targetMonths > 0 ? clampPercent((months / targetMonths) * 100) : 0;
}
