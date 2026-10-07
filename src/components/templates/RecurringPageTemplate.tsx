import type { AccountOption, CategoryOption, RecurringCandidateView } from "@/components/viewModels";
import { PageHeader } from "@/components/molecules/PageHeader";
import { RecurringBudgetPolicyNote } from "@/components/molecules/RecurringBudgetPolicyNote";
import { RecurringBudgetDecisionBanner, type BudgetDecisionItem } from "@/components/organisms/RecurringBudgetDecisionBanner";
import type { BudgetPolicy } from "@/domain/recurring/budgetInclusion";
import { RecurringCandidatesCard } from "@/components/organisms/RecurringCandidatesCard";
import { RecurringItemModal } from "@/components/organisms/RecurringItemModal";
import { RecurringItemsTable, type RecurringItemRow } from "@/components/organisms/RecurringItemsTable";

export interface RecurringPageTemplateProps {
  rows: RecurringItemRow[];
  candidates: RecurringCandidateView[];
  accounts: AccountOption[];
  categories: CategoryOption[];
  createAction: (formData: FormData) => Promise<void> | void;
  updateAction: (formData: FormData) => Promise<void> | void;
  deleteAction: (formData: FormData) => Promise<void> | void;
  toggleAction: (formData: FormData) => Promise<void> | void;
  acceptCandidateAction: (formData: FormData) => Promise<void> | void;
  dismissCandidateAction: (formData: FormData) => Promise<void> | void;
  pendingBudgetDecisions: BudgetDecisionItem[];
  budgetPolicy: BudgetPolicy;
  budgetDecisionAction: (formData: FormData) => void;
  resetBudgetPolicyAction: () => void;
}

export function RecurringPageTemplate({
  rows,
  candidates,
  accounts,
  categories,
  createAction,
  updateAction,
  deleteAction,
  toggleAction,
  acceptCandidateAction,
  dismissCandidateAction,
  pendingBudgetDecisions,
  budgetPolicy,
  budgetDecisionAction,
  resetBudgetPolicyAction,
}: RecurringPageTemplateProps) {
  return (
    <>
      <PageHeader
        title="Recurrentes"
        subtitle="Gastos e ingresos que se repiten cada mes."
        action={<RecurringItemModal mode="create" accounts={accounts} categories={categories} action={createAction} />}
      />

      <RecurringBudgetDecisionBanner pending={pendingBudgetDecisions} action={budgetDecisionAction} />

      <RecurringCandidatesCard candidates={candidates} acceptAction={acceptCandidateAction} dismissAction={dismissCandidateAction} />

      <p className="text-xs text-muted">
        <span className="font-medium text-foreground">Como presupuesto:</span> si está activo, el monto del recurrente sirve de presupuesto de su categoría. Si defines un presupuesto manual para esa categoría, el tuyo manda y el recurrente solo queda como referencia.
      </p>

      <RecurringItemsTable
        rows={rows}
        accounts={accounts}
        categories={categories}
       
        updateAction={updateAction}
        deleteAction={deleteAction}
        toggleAction={toggleAction}
        budgetDecisionAction={budgetDecisionAction}
      />

      <RecurringBudgetPolicyNote policy={budgetPolicy} resetAction={resetBudgetPolicyAction} />
    </>
  );
}
