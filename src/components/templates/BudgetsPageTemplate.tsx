import type { FormAction } from "@/lib/actionResult";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PageHeader } from "@/components/molecules/PageHeader";
import { PeriodMultiSelect, type PeriodMultiSelectOption } from "@/components/molecules/PeriodMultiSelect";
import { RecurringBudgetPolicyNote } from "@/components/molecules/RecurringBudgetPolicyNote";
import { EmergencyFundCard } from "@/components/organisms/EmergencyFundCard";
import { GoalsSection, type GoalsSectionProps } from "@/components/organisms/GoalsSection";
import { BudgetsTable, type BudgetRow } from "@/components/organisms/BudgetsTable";
import { RecurringBudgetDecisionBanner, type BudgetDecisionItem } from "@/components/organisms/RecurringBudgetDecisionBanner";
import type { BudgetPolicy } from "@/domain/recurring/budgetInclusion";
import { ROUTES } from "@/domain/shared/routes";

export interface BudgetsPageTemplateProps {
  goals: Omit<GoalsSectionProps, "createAction" | "updateAction" | "deleteAction">;
  createGoalAction: FormAction;
  updateGoalAction: FormAction;
  deleteGoalAction: FormAction;
  rows: BudgetRow[];
  periodLabel: string;
  scopeNote: string;
  periods: PeriodMultiSelectOption[];
  selectedIds: number[];
  setLineAction: FormAction;
  deleteLineAction: FormAction;
  pendingBudgetDecisions: BudgetDecisionItem[];
  budgetPolicy: BudgetPolicy;
  budgetDecisionAction: FormAction;
  resetBudgetPolicyAction: () => void;
}

export function BudgetsPageTemplate({
  goals,
  createGoalAction,
  updateGoalAction,
  deleteGoalAction,
  rows,
  periodLabel,
  scopeNote,
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
        title="Presupuestos y metas"
        subtitle={`Cuánto planeas gastar por categoría — ${periodLabel}. ${scopeNote}`}
        action={<PeriodMultiSelect periods={periods} selectedIds={selectedIds} basePath={ROUTES.budgets} />}
      />

      <RecurringBudgetDecisionBanner pending={pendingBudgetDecisions} action={budgetDecisionAction} />

      {rows.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="Todavía no tienes categorías"
              description="Crea categorías en Configuración para poder presupuestar por categoría."
              action={
                <Link href={ROUTES.settings} className="text-sm text-primary hover:underline">
                  Ir a Configuración →
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <BudgetsTable rows={rows} aside={<EmergencyFundCard emergencyFund={goals.emergencyFund} />} setLineAction={setLineAction} deleteLineAction={deleteLineAction} />
      )}

      <GoalsSection {...goals} createAction={createGoalAction} updateAction={updateGoalAction} deleteAction={deleteGoalAction} />

      <RecurringBudgetPolicyNote policy={budgetPolicy} resetAction={resetBudgetPolicyAction} />
    </>
  );
}
