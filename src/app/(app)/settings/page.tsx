import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { isCategoryOwnedByFamily, isConceptOwnedByFamily, isPayPeriodOwnedByFamily, isProviderOwnedByFamily } from "@/app/lib/authorization";
import { requireUser } from "@/app/lib/dal";
import { getFamilyCategories, getFamilyConcepts, getFamilyProviders } from "@/app/lib/queries";
import { CATEGORY_PALETTE } from "@/components/molecules/ColorSwatchPicker";
import { SettingsPageTemplate } from "@/components/templates/SettingsPageTemplate";
import { DEFAULT_CATEGORY_ICON } from "@/domain/categories/rules";
import { FLOWS, type Flow } from "@/domain/ledger/rules";
import { addDays, findPeriodIndexContaining } from "@/domain/payPeriod/rules";
import {
  createCategoryUseCase,
  createConceptUseCase,
  createPayPeriodUseCase,
  createProviderUseCase,
  deleteCategoryUseCase,
  deleteConceptUseCase,
  deletePayPeriodUseCase,
  deleteProviderUseCase,
  listPayPeriodsUseCase,
  updateCategoryUseCase,
  updateConceptUseCase,
  updatePayPeriodUseCase,
  updateProviderUseCase,
} from "@/infrastructure/container";
import { db } from "@/infrastructure/db/client";
import { users } from "@/infrastructure/db/schema/core";

function parseCategoryForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const classification = String(formData.get("classification") ?? "");
  const color = String(formData.get("color") ?? "");
  if (!name || !FLOWS.includes(classification as Flow)) return null;
  return { name, classification: classification as Flow, color: color || CATEGORY_PALETTE[0] };
}

async function createCategory(formData: FormData) {
  "use server";
  const user = await requireUser();
  const parsed = parseCategoryForm(formData);
  if (!parsed) return;

  await createCategoryUseCase.execute({ familyId: user.familyId, icon: DEFAULT_CATEGORY_ICON, ...parsed });
  revalidatePath("/settings");
  revalidatePath("/budgets");
  revalidatePath("/transactions");
}

async function updateCategory(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;
  if (!(await isCategoryOwnedByFamily(id, user.familyId))) return;

  const parsed = parseCategoryForm(formData);
  if (!parsed) return;

  await updateCategoryUseCase.execute({ id, ...parsed });
  revalidatePath("/settings");
  revalidatePath("/budgets");
  revalidatePath("/transactions");
  revalidatePath("/");
}

async function deleteCategory(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;
  if (!(await isCategoryOwnedByFamily(id, user.familyId))) return;

  await deleteCategoryUseCase.execute(id);
  revalidatePath("/settings");
  revalidatePath("/budgets");
  revalidatePath("/transactions");
  revalidatePath("/");
}

async function createPeriod(formData: FormData) {
  "use server";
  const user = await requireUser();
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  if (!start || !end) return;

  await createPayPeriodUseCase.execute(user.familyId, start, end);
  revalidatePath("/settings");
  revalidatePath("/budgets");
  revalidatePath("/");
}

async function updatePeriod(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = Number(formData.get("id"));
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  if (!id || !start || !end) return;
  if (!(await isPayPeriodOwnedByFamily(id, user.familyId))) return;

  await updatePayPeriodUseCase.execute(id, start, end);
  revalidatePath("/settings");
  revalidatePath("/budgets");
  revalidatePath("/");
}

async function deletePeriod(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;
  if (!(await isPayPeriodOwnedByFamily(id, user.familyId))) return;

  await deletePayPeriodUseCase.execute(id);
  revalidatePath("/settings");
  revalidatePath("/budgets");
  revalidatePath("/");
}

async function createProvider(formData: FormData) {
  "use server";
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await createProviderUseCase.execute(user.familyId, name);
  revalidatePath("/settings");
}

async function updateProvider(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  if (!(await isProviderOwnedByFamily(id, user.familyId))) return;

  await updateProviderUseCase.execute(id, name);
  revalidatePath("/settings");
  revalidatePath("/transactions");
  revalidatePath("/");
}

async function deleteProvider(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;
  if (!(await isProviderOwnedByFamily(id, user.familyId))) return;

  await deleteProviderUseCase.execute(id);
  revalidatePath("/settings");
}

function parseConceptForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = Number(formData.get("categoryId"));
  const providerIdRaw = formData.get("providerId");
  if (!name || !categoryId) return null;
  return { name, categoryId, providerId: providerIdRaw ? Number(providerIdRaw) : null };
}

async function createConcept(formData: FormData) {
  "use server";
  const user = await requireUser();
  const parsed = parseConceptForm(formData);
  const flow = String(formData.get("flow") ?? "");
  if (!parsed || !FLOWS.includes(flow as Flow)) return;

  await createConceptUseCase.execute({ familyId: user.familyId, flow: flow as Flow, ...parsed });
  revalidatePath("/settings");
  revalidatePath("/recurring");
}

async function updateConcept(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;
  if (!(await isConceptOwnedByFamily(id, user.familyId))) return;

  const parsed = parseConceptForm(formData);
  if (!parsed) return;

  await updateConceptUseCase.execute({ id, ...parsed });
  revalidatePath("/settings");
  revalidatePath("/recurring");
  revalidatePath("/transactions");
  revalidatePath("/");
}

async function deleteConcept(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;
  if (!(await isConceptOwnedByFamily(id, user.familyId))) return;

  await deleteConceptUseCase.execute(id);
  revalidatePath("/settings");
  revalidatePath("/recurring");
  revalidatePath("/transactions");
  revalidatePath("/");
}

export default async function SettingsPage() {
  const user = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const [categoriesList, providersList, conceptsList, [userRow], periods] = await Promise.all([
    getFamilyCategories(user.familyId),
    getFamilyProviders(user.familyId),
    getFamilyConcepts(user.familyId),
    db.select().from(users).where(eq(users.id, user.id)),
    listPayPeriodsUseCase.execute(user.familyId, today),
  ]);

  const lastPeriod = periods[periods.length - 1];
  const nextPeriodDefaultStart = lastPeriod ? addDays(lastPeriod.end, 1) : today;
  const nextPeriodDefaultEnd = addDays(nextPeriodDefaultStart, 14);
  const currentIdx = findPeriodIndexContaining(periods, today);
  const periodRows = periods.map((p, i) => ({ id: p.id, index: i + 1, start: p.start, end: p.end, isCurrent: i === currentIdx }));

  const categoryNameById = new Map(categoriesList.map((c) => [c.id, c.name]));
  const providerNameById = new Map(providersList.map((p) => [p.id, p.name]));
  const conceptRows = conceptsList.map((c) => ({
    id: c.id,
    name: c.name,
    categoryId: c.categoryId,
    categoryName: categoryNameById.get(c.categoryId) ?? "—",
    providerId: c.providerId,
    providerName: c.providerId != null ? providerNameById.get(c.providerId) ?? null : null,
    flow: c.flow,
  }));

  return (
    <SettingsPageTemplate
      userName={user.name}
      userEmail={userRow?.email}
      isTelegramLinked={Boolean(userRow?.telegramChatId)}
      categories={categoriesList}
      createCategoryAction={createCategory}
      updateCategoryAction={updateCategory}
      deleteCategoryAction={deleteCategory}
      providers={providersList}
      createProviderAction={createProvider}
      updateProviderAction={updateProvider}
      deleteProviderAction={deleteProvider}
      concepts={conceptRows}
      conceptCategoryOptions={categoriesList}
      conceptProviderOptions={providersList}
      createConceptAction={createConcept}
      updateConceptAction={updateConcept}
      deleteConceptAction={deleteConcept}
      periods={periodRows}
      nextPeriodDefaultStart={nextPeriodDefaultStart}
      nextPeriodDefaultEnd={nextPeriodDefaultEnd}
      createPeriodAction={createPeriod}
      updatePeriodAction={updatePeriod}
      deletePeriodAction={deletePeriod}
    />
  );
}
