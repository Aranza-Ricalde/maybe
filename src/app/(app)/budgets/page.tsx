import { getBudgetsPageUseCase, getGoalsPageUseCase } from "@/infrastructure/container";
import { requireUser } from "@/app/lib/dal";
import { BudgetsPageTemplate } from "@/components/templates/BudgetsPageTemplate";
import { todayIso } from "@/lib/today";
import { decideRecurringBudget, resetRecurringBudgetPolicy } from "../recurring/actions";
import { createGoal, deleteGoal, updateGoal } from "../goals/actions";
import { deleteBudgetLine, setBudgetLine } from "./actions";
import type { PeriodsSearchParams } from "@/domain/shared/routes";

export default async function BudgetsPage({ searchParams }: { searchParams: Promise<PeriodsSearchParams> }) {
  const user = await requireUser();
  const { periods } = await searchParams;
  const today = todayIso();
  const [data, goals] = await Promise.all([getBudgetsPageUseCase.execute(user.familyId, today, periods), getGoalsPageUseCase.execute(user.familyId, today)]);

  return (
    <BudgetsPageTemplate
      {...data}
      goals={goals}
      createGoalAction={createGoal}
      updateGoalAction={updateGoal}
      deleteGoalAction={deleteGoal}
      setLineAction={setBudgetLine}
      deleteLineAction={deleteBudgetLine}
      budgetDecisionAction={decideRecurringBudget}
      resetBudgetPolicyAction={resetRecurringBudgetPolicy}
    />
  );
}
