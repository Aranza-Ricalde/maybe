import { getBudgetsPageUseCase } from "@/infrastructure/container";
import { requireUser } from "@/app/lib/dal";
import { BudgetsPageTemplate } from "@/components/templates/BudgetsPageTemplate";
import { todayIso } from "@/lib/today";
import { decideRecurringBudget, resetRecurringBudgetPolicy } from "../recurring/actions";
import { deleteBudgetLine, setBudgetLine } from "./actions";
import type { PeriodsSearchParams } from "@/domain/shared/routes";

export default async function BudgetsPage({ searchParams }: { searchParams: Promise<PeriodsSearchParams> }) {
  const user = await requireUser();
  const { periods } = await searchParams;
  const data = await getBudgetsPageUseCase.execute(user.familyId, todayIso(), periods);

  return (
    <BudgetsPageTemplate
      {...data}
      setLineAction={setBudgetLine}
      deleteLineAction={deleteBudgetLine}
      budgetDecisionAction={decideRecurringBudget}
      resetBudgetPolicyAction={resetRecurringBudgetPolicy}
    />
  );
}
