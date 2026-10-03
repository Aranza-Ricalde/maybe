import { revalidatePath } from "next/cache";
import { isGoalOwnedByFamily } from "@/app/lib/authorization";
import { requireUser } from "@/app/lib/dal";
import { getFamilyAccounts, getFamilyGoals, getGoalAccountLinks } from "@/app/lib/queries";
import { GoalsPageTemplate } from "@/components/templates/GoalsPageTemplate";
import { createGoalUseCase, deleteGoalUseCase, updateGoalUseCase } from "@/infrastructure/container";
import { DrizzleCashflowRepository } from "@/infrastructure/db/cashflow";

function parseAccountIds(formData: FormData): number[] {
  return formData.getAll("accountIds").map(Number).filter((id) => Number.isFinite(id));
}

async function createGoal(formData: FormData) {
  "use server";
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const targetAmount = Number(formData.get("targetAmount"));
  const targetDate = String(formData.get("targetDate") ?? "");
  if (!name || !targetAmount) return;

  await createGoalUseCase.execute({
    familyId: user.familyId,
    name,
    targetAmountCents: Math.round(targetAmount * 100),
    targetDate: targetDate || null,
    accountIds: parseAccountIds(formData),
  });
  revalidatePath("/goals");
  revalidatePath("/");
}

async function updateGoal(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const targetAmount = Number(formData.get("targetAmount"));
  const targetDate = String(formData.get("targetDate") ?? "");
  if (!id || !name || !targetAmount) return;
  if (!(await isGoalOwnedByFamily(id, user.familyId))) return;

  await updateGoalUseCase.execute({
    id,
    name,
    targetAmountCents: Math.round(targetAmount * 100),
    targetDate: targetDate || null,
    accountIds: parseAccountIds(formData),
  });
  revalidatePath("/goals");
  revalidatePath("/");
}

async function deleteGoal(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;
  if (!(await isGoalOwnedByFamily(id, user.familyId))) return;

  await deleteGoalUseCase.execute(id);
  revalidatePath("/goals");
  revalidatePath("/");
}

export default async function GoalsPage() {
  const user = await requireUser();
  const [goalsList, accountsList, goalAccountLinks] = await Promise.all([
    getFamilyGoals(user.familyId),
    getFamilyAccounts(user.familyId),
    getGoalAccountLinks(user.familyId),
  ]);
  const cashflowRepo = new DrizzleCashflowRepository();
  const today = new Date().toISOString().slice(0, 10);
  const accountNameById = new Map(accountsList.map((a) => [a.id, a.name]));

  const accountIdsByGoal = new Map<number, number[]>();
  for (const link of goalAccountLinks) {
    const list = accountIdsByGoal.get(link.goalId) ?? [];
    list.push(link.accountId);
    accountIdsByGoal.set(link.goalId, list);
  }

  const currentAmounts = await Promise.all(
    goalsList.map((g) => cashflowRepo.getCurrentBalanceCents(accountIdsByGoal.get(g.id) ?? [], today)),
  );

  const rows = goalsList.map((g, i) => {
    const linkedAccountIds = accountIdsByGoal.get(g.id) ?? [];
    return {
      id: g.id,
      name: g.name,
      targetAmountCents: g.targetAmountCents,
      targetDate: g.targetDate,
      currentCents: currentAmounts[i],
      linkedAccountIds,
      linkedAccountNames: linkedAccountIds.map((id) => accountNameById.get(id) ?? `Cuenta ${id}`),
    };
  });

  return <GoalsPageTemplate rows={rows} accounts={accountsList} createAction={createGoal} updateAction={updateGoal} deleteAction={deleteGoal} />;
}
