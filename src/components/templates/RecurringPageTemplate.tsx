import type { getPendingRecurringCandidates } from "@/app/lib/queries";
import { PageHeader } from "@/components/molecules/PageHeader";
import { RecurringCandidatesCard } from "@/components/organisms/RecurringCandidatesCard";
import { RecurringItemModal, type RecurringItemAccountOption, type RecurringItemCategoryOption, type RecurringItemConceptOption } from "@/components/organisms/RecurringItemModal";
import { RecurringItemsTable, type RecurringItemRow } from "@/components/organisms/RecurringItemsTable";

export interface RecurringPageTemplateProps {
  rows: RecurringItemRow[];
  candidates: Awaited<ReturnType<typeof getPendingRecurringCandidates>>;
  accounts: RecurringItemAccountOption[];
  categories: RecurringItemCategoryOption[];
  concepts: RecurringItemConceptOption[];
  createAction: (formData: FormData) => Promise<void> | void;
  updateAction: (formData: FormData) => Promise<void> | void;
  deleteAction: (formData: FormData) => Promise<void> | void;
  toggleAction: (formData: FormData) => Promise<void> | void;
}

export function RecurringPageTemplate({
  rows,
  candidates,
  accounts,
  categories,
  concepts,
  createAction,
  updateAction,
  deleteAction,
  toggleAction,
}: RecurringPageTemplateProps) {
  return (
    <>
      <PageHeader
        title="Recurrentes"
        subtitle="Gastos e ingresos que se repiten cada mes."
        action={<RecurringItemModal mode="create" accounts={accounts} categories={categories} concepts={concepts} action={createAction} />}
      />

      <RecurringCandidatesCard candidates={candidates} />

      <RecurringItemsTable
        rows={rows}
        accounts={accounts}
        categories={categories}
        concepts={concepts}
        updateAction={updateAction}
        deleteAction={deleteAction}
        toggleAction={toggleAction}
      />
    </>
  );
}
