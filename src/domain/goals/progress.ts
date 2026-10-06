import { groupBy, indexBy } from "@/domain/shared/collections";

export interface GoalLink {
  goalId: number;
  accountId: number;
}

export function accountIdsByGoal(links: GoalLink[]): Map<number, number[]> {
  const byGoal = new Map<number, number[]>();
  for (const [goalId, goalLinks] of groupBy(links, (link) => link.goalId)) byGoal.set(goalId, goalLinks.map((link) => link.accountId));
  return byGoal;
}

export function goalCurrentCents(accountIds: number[], balanceByAccount: Map<number, number>): number {
  return accountIds.reduce((sum, accountId) => sum + (balanceByAccount.get(accountId) ?? 0), 0);
}

export interface GoalForView {
  id: number;
  name: string;
  targetAmountCents: number;
  targetDate: string | null;
}

export interface GoalProjectionForView<M, P> {
  goalId: number;
  currentCents: number;
  projection: P;
  message: M;
}

export function goalProjectionInputs<G extends GoalForView>(goals: G[], accountIdsByGoalId: Map<number, number[]>) {
  return goals.map((goal) => ({ id: goal.id, name: goal.name, targetAmountCents: goal.targetAmountCents, targetDate: goal.targetDate, accountIds: accountIdsByGoalId.get(goal.id) ?? [] }));
}

export function goalSummaries<G extends GoalForView, M, P>(goals: G[], projections: Array<GoalProjectionForView<M, P>>) {
  const byGoal = indexBy(projections, (projection) => projection.goalId);
  return goals.map((goal) => ({
    id: goal.id,
    name: goal.name,
    targetAmountCents: goal.targetAmountCents,
    currentCents: byGoal.get(goal.id)?.currentCents ?? 0,
    projection: byGoal.get(goal.id)?.message ?? null,
  }));
}

export function goalRows<G extends GoalForView, M, P>(
  goals: G[],
  accountIdsByGoalId: Map<number, number[]>,
  projections: Array<GoalProjectionForView<M, P>>,
  accountNameById: Map<number, string>,
) {
  return goalSummaries(goals, projections).map((summary, index) => {
    const linkedAccountIds = accountIdsByGoalId.get(summary.id) ?? [];
    return {
      ...summary,
      targetDate: goals[index].targetDate,
      linkedAccountIds,
      linkedAccountNames: linkedAccountIds.map((id) => accountNameById.get(id) ?? `Cuenta ${id}`),
    };
  });
}
