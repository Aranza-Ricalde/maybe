import { Card } from "@heroui/react";
import Link from "next/link";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PageHeader } from "@/components/molecules/PageHeader";
import { PeriodMultiSelect, type PeriodMultiSelectOption } from "@/components/molecules/PeriodMultiSelect";
import { RecurringBudgetPolicyNote } from "@/components/molecules/RecurringBudgetPolicyNote";
import { BudgetsTable, type BudgetRow } from "@/components/organisms/BudgetsTable";
import { RecurringBudgetDecisionBanner, type BudgetDecisionItem } from "@/components/organisms/RecurringBudgetDecisionBanner";
import type { BudgetPolicy } from "@/domain/recurring/budgetInclusion";
import { ROUTES } from "@/domain/shared/routes";

export interface BudgetsPageTemplateProps {
  rows: BudgetRow[];
  periodLabel: string;
  periods: PeriodMultiSelectOption[];
  selectedIds: number[];
  setLineAction: (formData: FormData) => Promise<void> | void;
  deleteLineAction: (formData: FormData) => Promise<void> | void;
  pendingBudgetDecisions: BudgetDecisionItem[];
  budgetPolicy: BudgetPolicy;
  budgetDecisionAction: (formData: FormData) => void;
  resetBudgetPolicyAction: () => void;
}

export function BudgetsPageTemplate({
  rows,
  periodLabel,
  periods,
  selectedIds,
  setLineAction,
  deleteLineAction,
  pendingBudgetDecisions,
  budgetPolicy,
  budgetDecisionAction,
  resetBudgetPolicyAction,
}: BudgetsPageTemplateProps) {
  return (
    <>
      <PageHeader
        title="Presupuesto"
        subtitle={`Cuánto planeas gastar por categoría — ${periodLabel}.`}
        action={<PeriodMultiSelect periods={periods} selectedIds={selectedIds} basePath={ROUTES.budgets} />}
      />

      <RecurringBudgetDecisionBanner pending={pendingBudgetDecisions} action={budgetDecisionAction} />

      {rows.length === 0 ? (
        <Card className="p-5">
          <EmptyState
            title="Todavía no tienes categorías"
            description="Crea categorías en Configuración para poder presupuestar por categoría."
            action={
              <Link href={ROUTES.settings} className="text-sm text-accent hover:underline">
                Ir a Configuración →
              </Link>
            }
          />
        </Card>
      ) : (
        <BudgetsTable rows={rows} setLineAction={setLineAction} deleteLineAction={deleteLineAction} />
      )}

      <RecurringBudgetPolicyNote policy={budgetPolicy} resetAction={resetBudgetPolicyAction} />
    </>
  );
}
