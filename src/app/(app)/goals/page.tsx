import { getGoalsPageUseCase } from "@/infrastructure/container";
import { requireUser } from "@/app/lib/dal";
import { GoalsPageTemplate } from "@/components/templates/GoalsPageTemplate";
import { todayIso } from "@/lib/today";
import { createGoal, deleteGoal, updateGoal } from "./actions";

export default async function GoalsPage() {
  const user = await requireUser();
  const data = await getGoalsPageUseCase.execute(user.familyId, todayIso());

  return <GoalsPageTemplate {...data} createAction={createGoal} updateAction={updateGoal} deleteAction={deleteGoal} />;
}
