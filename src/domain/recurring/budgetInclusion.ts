export const BUDGET_INCLUSIONS = ["included", "excluded"] as const;
export type BudgetInclusion = (typeof BUDGET_INCLUSIONS)[number];

export const BUDGET_POLICIES = ["ask", "always_include", "never_include"] as const;
export type BudgetPolicy = (typeof BUDGET_POLICIES)[number];

export const BUDGET_DECISIONS = ["include", "exclude"] as const;
export type BudgetDecision = (typeof BUDGET_DECISIONS)[number];

export class InvalidBudgetDecisionError extends Error {}

export function assertValidBudgetDecision(decision: string): asserts decision is BudgetDecision {
  if (!BUDGET_DECISIONS.includes(decision as BudgetDecision)) {
    throw new InvalidBudgetDecisionError(`Decisión de presupuesto inválida: "${decision}".`);
  }
}

export function assertValidBudgetInclusion(value: string | null | undefined): asserts value is BudgetInclusion | null | undefined {
  if (value != null && !BUDGET_INCLUSIONS.includes(value as BudgetInclusion)) {
    throw new InvalidBudgetDecisionError(`Valor de presupuesto inválido: "${value}".`);
  }
}

export function inclusionOfDecision(decision: BudgetDecision): BudgetInclusion {
  return decision === "include" ? "included" : "excluded";
}

export function policyOfDecision(decision: BudgetDecision): BudgetPolicy {
  return decision === "include" ? "always_include" : "never_include";
}

export function normalizeBudgetPolicy(stored: string | null | undefined): BudgetPolicy {
  return BUDGET_POLICIES.includes(stored as BudgetPolicy) ? (stored as BudgetPolicy) : "ask";
}

export function inclusionForNewItem(policy: BudgetPolicy): BudgetInclusion | null {
  if (policy === "always_include") return "included";
  if (policy === "never_include") return "excluded";
  return null;
}

export function countsTowardBudget(item: { budgetInclusion?: string | null }): boolean {
  return item.budgetInclusion !== "excluded";
}

export interface BudgetDecisionCandidate {
  id: number;
  name: string;
  flow: "income" | "expense";
  status: "active" | "paused";
  categoryId: number | null;
  estimatedAmountCents: number;
  budgetInclusion?: string | null;
}

export function isBudgetRelevant(item: Pick<BudgetDecisionCandidate, "flow" | "status" | "categoryId">): boolean {
  return item.flow === "expense" && item.status === "active" && item.categoryId != null;
}

export function pendingBudgetDecisions<T extends BudgetDecisionCandidate>(items: T[], policy: BudgetPolicy): T[] {
  if (policy !== "ask") return [];
  return items.filter((i) => isBudgetRelevant(i) && i.budgetInclusion == null);
}

export interface PendingBudgetDecisionView {
  id: number;
  name: string;
  amountCents: number;
  categoryName: string;
}

export function pendingBudgetDecisionViews(
  items: Array<BudgetDecisionCandidate & { id: number; name: string; estimatedAmountCents: number; categoryId: number | null }>,
  policy: BudgetPolicy,
  categoryNameById: Map<number, string>,
): PendingBudgetDecisionView[] {
  return pendingBudgetDecisions(items, policy).map((item) => ({
    id: item.id,
    name: item.name,
    amountCents: item.estimatedAmountCents,
    categoryName: (item.categoryId != null ? categoryNameById.get(item.categoryId) : undefined) ?? "su categoría",
  }));
}
