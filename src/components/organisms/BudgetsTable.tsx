"use client";

import { Chip } from "@/components/atoms/Chip";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { BudgetLineModal } from "./BudgetLineModal";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { ClientDataTable } from "./ClientDataTable";
import type { DataTableColumn } from "./DataTable";
import { classifyBudgetProgress, computeBudgetPercent, type BudgetCadence } from "@/domain/budget/rules";
import { BUDGET_CADENCE_OPTIONS, formatCurrency, formatPercent } from "@/lib/format";
import { FIELD } from "@/lib/formFields";
import { CategoryNameCell } from "@/components/molecules/CategoryNameCell";

export interface BudgetRow {
  categoryId: number;
  name: string;
  color: string;
  cadence: BudgetCadence;
  manualBudgetedAmountCents: number;
  effectiveBudgetedCents: number;
  actualCents: number;
  depth: 0 | 1;
  childrenAllocatedCents: number;
  isOverAllocated: boolean;
  isDerivedFromChildren: boolean;
}

export interface BudgetsTableProps {
  rows: BudgetRow[];
  setLineAction: (formData: FormData) => Promise<void> | void;
  deleteLineAction: (formData: FormData) => Promise<void> | void;
}

const CADENCE_LABEL = Object.fromEntries(BUDGET_CADENCE_OPTIONS.map((o) => [o.value, o.label]));

function percentChip(budgetedCents: number, actualCents: number) {
  const percent = computeBudgetPercent(budgetedCents, actualCents);
  if (percent === null) return <Text size="xs" tone="muted">Sin presupuestar</Text>;
  return (
    <Chip tone={classifyBudgetProgress(percent)} className="tabular-nums">
      {formatPercent(percent)}
    </Chip>
  );
}

export function BudgetsTable({ rows, setLineAction, deleteLineAction }: BudgetsTableProps) {

  const columns: DataTableColumn<BudgetRow>[] = [
    {
      key: "name",
      header: "Categoría",
      isRowHeader: true,
      cell: (c) => <CategoryNameCell name={c.name} color={c.color} depth={c.depth} />,
    },
    { key: "actual", header: "Gastado", align: "right", cell: (c) => <CurrencyText cents={c.actualCents} absolute /> },
    {
      key: "budgeted",
      header: "Presupuestado",
      align: "right",
      cell: (c) =>
        c.effectiveBudgetedCents > 0 ? (
          <div className="flex flex-col items-end">
            <CurrencyText cents={c.effectiveBudgetedCents} tone="muted" />
            {c.manualBudgetedAmountCents > 0 && (
              <Text size="xs" tone="muted">
                {CADENCE_LABEL[c.cadence]}
              </Text>
            )}
            {c.isDerivedFromChildren && (
              <Text size="xs" tone="muted">
                Suma de sus subcategorías
              </Text>
            )}
            {c.isOverAllocated && (
              <Text size="xs" tone="danger">
                Sus subcategorías suman {formatCurrency(c.childrenAllocatedCents)}, más que este tope
              </Text>
            )}
          </div>
        ) : (
          <Text tone="muted">—</Text>
        ),
    },
    { key: "pct", header: "Progreso", align: "right", cell: (c) => percentChip(c.effectiveBudgetedCents, c.actualCents) },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      cell: (c) => (
        <div className="flex items-center justify-end gap-1">
          <BudgetLineModal
            categoryId={c.categoryId}
            categoryName={c.name}
            cadence={c.cadence}
            budgetedAmountCents={c.manualBudgetedAmountCents}
            action={setLineAction}
          />
          {c.manualBudgetedAmountCents > 0 && (
            <ConfirmDeleteButton
              title="Quitar presupuesto"
              triggerAriaLabel={`Quitar presupuesto de ${c.name}`}
              confirmQuestion={
                <>
                  ¿Quitar el presupuesto de <span className="font-semibold">&ldquo;{c.name}&rdquo;</span>?
                </>
              }
              hiddenFields={{ [FIELD.categoryId]: c.categoryId }}
              action={deleteLineAction}
              submitLabel="Sí, quitar"
              pendingLabel="Quitando…"
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <ClientDataTable
      ariaLabel="Presupuesto por categoría"
      columns={columns}
      rows={rows}
      getRowId={(c) => c.categoryId}
      emptyTitle="Sin categorías todavía"
      emptyDescription="Crea categorías en Configuración para poder presupuestar."
      itemsLabel="categorías"
      minWidthClassName="min-w-[560px]"
    />
  );
}
