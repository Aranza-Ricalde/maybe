import { getRecurringPageUseCase } from "@/infrastructure/container";
import { requireUser } from "@/app/lib/dal";
import { RecurringPageTemplate } from "@/components/templates/RecurringPageTemplate";
import { todayIso } from "@/lib/today";
import { acceptCandidate, createRecurringItem, decideRecurringBudget, deleteRecurringItem, dismissCandidate, resetRecurringBudgetPolicy, savePayroll, toggleRecurringItem, updateRecurringItem } from "./actions";

export default async function RecurringPage() {
  const user = await requireUser();
  const data = await getRecurringPageUseCase.execute(user.familyId, todayIso());

  return (
    <RecurringPageTemplate
      {...data}
      createAction={createRecurringItem}
      savePayrollAction={savePayroll}
      updateAction={updateRecurringItem}
      deleteAction={deleteRecurringItem}
      toggleAction={toggleRecurringItem}
      acceptCandidateAction={acceptCandidate}
      dismissCandidateAction={dismissCandidate}
      budgetDecisionAction={decideRecurringBudget}
      resetBudgetPolicyAction={resetRecurringBudgetPolicy}
    />
  );
}
