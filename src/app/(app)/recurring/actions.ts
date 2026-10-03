"use server";

import { revalidatePath } from "next/cache";
import { isRecurringCandidateOwnedByFamily, isRecurringItemOwnedByFamily } from "@/app/lib/authorization";
import { requireUser } from "@/app/lib/dal";
import { FLOWS, type Flow } from "@/domain/ledger/rules";
import {
  acceptRecurringCandidateUseCase,
  createRecurringItemUseCase,
  deleteRecurringItemUseCase,
  dismissRecurringCandidateUseCase,
  toggleRecurringItemStatusUseCase,
  updateRecurringItemUseCase,
} from "@/infrastructure/container";

function parseRecurringForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const flow = String(formData.get("flow") ?? "");
  const estimatedAmount = Number(formData.get("estimatedAmount"));
  const dayOfMonth = Number(formData.get("dayOfMonth"));
  const categoryIdRaw = formData.get("categoryId");
  const conceptIdRaw = formData.get("conceptId");
  const accountIdRaw = formData.get("accountId");

  if (!name || !FLOWS.includes(flow as Flow) || !Number.isFinite(estimatedAmount) || estimatedAmount <= 0) return null;
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) return null;

  return {
    name,
    flow: flow as Flow,
    estimatedAmount,
    dayOfMonth,
    categoryId: categoryIdRaw ? Number(categoryIdRaw) : null,
    conceptId: conceptIdRaw ? Number(conceptIdRaw) : null,
    accountId: accountIdRaw ? Number(accountIdRaw) : null,
  };
}

export async function createRecurringItem(formData: FormData) {
  const user = await requireUser();
  const parsed = parseRecurringForm(formData);
  if (!parsed) return;

  await createRecurringItemUseCase.execute({ familyId: user.familyId, ...parsed });
  revalidatePath("/recurring");
  revalidatePath("/");
}

export async function updateRecurringItem(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;
  if (!(await isRecurringItemOwnedByFamily(id, user.familyId))) return;

  const parsed = parseRecurringForm(formData);
  if (!parsed) return;

  await updateRecurringItemUseCase.execute({ id, ...parsed });
  revalidatePath("/recurring");
  revalidatePath("/");
}

export async function deleteRecurringItem(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;
  if (!(await isRecurringItemOwnedByFamily(id, user.familyId))) return;

  await deleteRecurringItemUseCase.execute(id);
  revalidatePath("/recurring");
  revalidatePath("/");
}

export async function acceptCandidate(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;
  if (!(await isRecurringCandidateOwnedByFamily(id, user.familyId))) return;

  await acceptRecurringCandidateUseCase.execute(id, new Date().getUTCDate());
  revalidatePath("/");
  revalidatePath("/recurring");
}

export async function dismissCandidate(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;
  if (!(await isRecurringCandidateOwnedByFamily(id, user.familyId))) return;

  await dismissRecurringCandidateUseCase.execute(id);
  revalidatePath("/");
  revalidatePath("/recurring");
}

export async function toggleRecurringItem(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  const nextStatus = String(formData.get("nextStatus"));
  if (!id) return;
  if (!(await isRecurringItemOwnedByFamily(id, user.familyId))) return;

  await toggleRecurringItemStatusUseCase.execute(id, nextStatus === "active" ? "active" : "paused");
  revalidatePath("/recurring");
}
