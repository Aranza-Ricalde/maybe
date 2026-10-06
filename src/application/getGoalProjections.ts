import type { BalanceReader } from "@/domain/dashboard/ports";
import { GOAL_PACE_WINDOW_DAYS, describeGoalProjection, projectGoal, type GoalProjection, type GoalProjectionMessage } from "@/domain/goals/projection";
import { goalCurrentCents } from "@/domain/goals/progress";
import { addDays } from "@/domain/payPeriod/rules";

export interface GoalToProject {
  id: number;
  name: string;
  targetAmountCents: number;
  targetDate: string | null;
  accountIds: number[];
}

export interface GoalProjectionView {
  goalId: number;
  currentCents: number;
  projection: GoalProjection | null;
  message: GoalProjectionMessage;
}

export class GetGoalProjectionsUseCase {
  constructor(private readonly repo: BalanceReader) {}

  async execute(goals: GoalToProject[], today: string): Promise<GoalProjectionView[]> {
    const windowStart = addDays(today, -GOAL_PACE_WINDOW_DAYS);
    const accountIds = [...new Set(goals.flatMap((goal) => goal.accountIds))];
    const [balancesNow, balancesAtWindowStart] = await Promise.all([
      this.repo.getBalancesByAccount(accountIds, today),
      this.repo.getBalancesByAccount(accountIds, windowStart),
    ]);

    return goals.map((goal) => {
      if (goal.accountIds.length === 0) {
        return { goalId: goal.id, currentCents: 0, projection: null, message: { headline: "Liga una cuenta de ahorro para estimar cuándo la alcanzarías" } };
      }
      const currentCents = goalCurrentCents(goal.accountIds, balancesNow);
      const projection = projectGoal({
        currentCents,
        targetCents: goal.targetAmountCents,
        balanceAtWindowStartCents: goalCurrentCents(goal.accountIds, balancesAtWindowStart),
        windowDays: GOAL_PACE_WINDOW_DAYS,
        targetDate: goal.targetDate,
        today,
      });
      return { goalId: goal.id, currentCents, projection, message: describeGoalProjection(projection, goal.targetDate) };
    });
  }
}
