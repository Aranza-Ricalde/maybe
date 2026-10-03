import { requireUser } from "@/app/lib/dal";
import { getFamilyAccounts, getFamilyCategories, getFamilyConcepts, getFamilyRecurringItems, getPendingRecurringCandidates } from "@/app/lib/queries";
import { RecurringPageTemplate } from "@/components/templates/RecurringPageTemplate";
import { createRecurringItem, deleteRecurringItem, toggleRecurringItem, updateRecurringItem } from "./actions";

export default async function RecurringPage() {
  const user = await requireUser();
  const [items, candidates, accountsList, categoriesList, conceptsList] = await Promise.all([
    getFamilyRecurringItems(user.familyId),
    getPendingRecurringCandidates(user.familyId),
    getFamilyAccounts(user.familyId),
    getFamilyCategories(user.familyId),
    getFamilyConcepts(user.familyId),
  ]);

  return (
    <RecurringPageTemplate
      rows={items}
      candidates={candidates}
      accounts={accountsList}
      categories={categoriesList}
      concepts={conceptsList}
      createAction={createRecurringItem}
      updateAction={updateRecurringItem}
      deleteAction={deleteRecurringItem}
      toggleAction={toggleRecurringItem}
    />
  );
}
