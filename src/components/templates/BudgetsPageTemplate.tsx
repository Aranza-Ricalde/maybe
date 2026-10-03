import { Card } from "@heroui/react";
import Link from "next/link";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PageHeader } from "@/components/molecules/PageHeader";
import { PeriodMultiSelect, type PeriodMultiSelectOption } from "@/components/molecules/PeriodMultiSelect";
import { BudgetsTable, type BudgetRow } from "@/components/organisms/BudgetsTable";

export interface BudgetsPageTemplateProps {
  rows: BudgetRow[];
  periodLabel: string;
  periods: PeriodMultiSelectOption[];
  selectedIds: number[];
  setLineAction: (formData: FormData) => Promise<void> | void;
  deleteLineAction: (formData: FormData) => Promise<void> | void;
}

export function BudgetsPageTemplate({ rows, periodLabel, periods, selectedIds, setLineAction, deleteLineAction }: BudgetsPageTemplateProps) {
  return (
    <>
      <PageHeader
        title="Presupuesto"
        subtitle={`Cuánto planeas gastar por categoría — ${periodLabel}.`}
        action={<PeriodMultiSelect periods={periods} selectedIds={selectedIds} basePath="/budgets" />}
      />

      {rows.length === 0 ? (
        <Card className="p-5">
          <EmptyState
            title="Todavía no tienes categorías"
            description="Crea categorías en Configuración para poder presupuestar por categoría."
            action={
              <Link href="/settings" className="text-sm text-accent hover:underline">
                Ir a Configuración →
              </Link>
            }
          />
        </Card>
      ) : (
        <BudgetsTable rows={rows} setLineAction={setLineAction} deleteLineAction={deleteLineAction} />
      )}
    </>
  );
}
