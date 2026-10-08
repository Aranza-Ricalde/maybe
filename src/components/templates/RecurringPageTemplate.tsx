import type { FormAction } from "@/lib/actionResult";
import type { AccountOption, CategoryOption, RecurringCandidateView } from "@/components/viewModels";
import { Info } from "lucide-react";
import { StatBlock } from "@/components/molecules/StatBlock";
import { StatBlockRow } from "@/components/molecules/StatBlockRow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { RecurringSummary } from "@/domain/recurring/summary";
import { formatCurrency } from "@/lib/format";
import { PayrollCard } from "@/components/organisms/PayrollCard";
import type { PeriodRange } from "@/domain/payPeriod/rules";
import type { PayrollSetup } from "@/domain/recurring/payroll";
import { PageHeader } from "@/components/molecules/PageHeader";
import { RecurringBudgetPolicyNote } from "@/components/molecules/RecurringBudgetPolicyNote";
import { RecurringBudgetDecisionBanner, type BudgetDecisionItem } from "@/components/organisms/RecurringBudgetDecisionBanner";
import type { BudgetPolicy } from "@/domain/recurring/budgetInclusion";
import { RecurringCandidatesCard } from "@/components/organisms/RecurringCandidatesCard";
import { RecurringItemModal } from "@/components/organisms/RecurringItemModal";
import { RecurringItemsTable, type RecurringItemRow } from "@/components/organisms/RecurringItemsTable";

export interface RecurringPageTemplateProps {
  summary: RecurringSummary;
  payroll: { setup: PayrollSetup | null; periods: PeriodRange[]; suggestedMonthlyDay: number | null; categoryId: number | null; today: string };
  savePayrollAction: FormAction;
  rows: RecurringItemRow[];
  candidates: RecurringCandidateView[];
  accounts: AccountOption[];
  categories: CategoryOption[];
  createAction: FormAction;
  updateAction: FormAction;
  deleteAction: FormAction;
  toggleAction: FormAction;
  acceptCandidateAction: FormAction;
  dismissCandidateAction: FormAction;
  pendingBudgetDecisions: BudgetDecisionItem[];
  budgetPolicy: BudgetPolicy;
  budgetDecisionAction: FormAction;
  resetBudgetPolicyAction: () => void;
}

export function RecurringPageTemplate({
  rows,
  summary,
  payroll,
  savePayrollAction,
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

      <StatBlockRow>
        <StatBlock label="Ingresos fijos al mes" value={formatCurrency(summary.incomeCents)} tone="success" tooltip="Suma de tus ingresos recurrentes activos." />
        <StatBlock label="Gastos fijos al mes" value={formatCurrency(summary.expenseCents)} tooltip="Suma de tus gastos recurrentes activos." />
        <StatBlock label="Te queda después de lo fijo" value={formatCurrency(summary.netCents)} tone={summary.netCents < 0 ? "danger" : "default"} hint={<p className="mt-1 text-xs text-muted-foreground">{summary.activeCount} recurrentes activos</p>} />
      </StatBlockRow>

      <PayrollCard setup={payroll.setup} periods={payroll.periods} suggestedMonthlyDay={payroll.suggestedMonthlyDay} categoryId={payroll.categoryId} today={payroll.today} accounts={accounts} action={savePayrollAction} />

      <RecurringBudgetDecisionBanner pending={pendingBudgetDecisions} action={budgetDecisionAction} />

      <RecurringCandidatesCard candidates={candidates} acceptAction={acceptCandidateAction} dismissAction={dismissCandidateAction} />

      <Alert variant="info">
        <Info />
        <AlertTitle>Suma al presupuesto</AlertTitle>
        <AlertDescription>Si está activo, el monto del recurrente sirve de presupuesto de su categoría. Si defines un presupuesto manual para esa categoría, el tuyo manda y el recurrente solo queda como referencia.</AlertDescription>
      </Alert>

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
