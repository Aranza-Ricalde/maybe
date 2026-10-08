"use client";

import type { FormAction } from "@/lib/actionResult";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveDialog } from "@/components/molecules/ResponsiveDialog";
import { useRowAction } from "@/hooks/useRowAction";
import { BUDGET_CADENCE_OPTIONS, formatCurrency } from "@/lib/format";
import { describeBudgetOrigin, describeCategory } from "@/lib/budgetCopy";
import { FIELD } from "@/lib/formFields";
import { budgetLineStatus } from "@/lib/presenters/budgets";
import type { BudgetRow } from "./BudgetsTable";

const PROGRESS_VARIANT = { success: "success", warning: "warning", danger: "destructive" } as const;

function toneVariant(tone: ReturnType<typeof budgetLineStatus>["tone"]) {
  return tone === null ? "default" : PROGRESS_VARIANT[tone];
}

interface Actions {
  setLineAction: FormAction;
  deleteLineAction: FormAction;
}

function BudgetLineForm({ row, title, setLineAction, deleteLineAction }: { row: BudgetRow; title: string } & Actions) {
  const { isPending, submit, remove } = useRowAction(setLineAction, deleteLineAction);
  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input type="hidden" name={FIELD.categoryId} value={row.categoryId} />
      <p className="flex items-center gap-2 text-sm font-medium">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: row.color }} />
        {title}
      </p>
      <div className="grid grid-cols-[minmax(0,1fr)_9rem] gap-3">
        <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          Monto presupuestado
          <span className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">$</span>
            <Input name={FIELD.amount} type="number" step="0.01" min="0.01" placeholder="0.00" aria-label={`Monto de ${row.name}`} defaultValue={row.manualBudgetedAmountCents > 0 ? String(row.manualBudgetedAmountCents / 100) : undefined} required className="pl-6 text-foreground tabular-nums" />
          </span>
        </label>
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          Cadencia
          <Select name={FIELD.cadence} defaultValue={row.cadence} items={BUDGET_CADENCE_OPTIONS}>
            <SelectTrigger aria-label={`Cadencia de ${row.name}`} className="w-full text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUDGET_CADENCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        {row.manualBudgetedAmountCents > 0 && (
          <Button type="button" variant="ghost" size="sm" disabled={isPending} aria-label={`Quitar presupuesto de ${row.name}`} onClick={() => remove(row.categoryId)}>
            Quitar
          </Button>
        )}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

function BudgetHeadline({ row }: { row: BudgetRow }) {
  const { ratio, barValue, tone, leftCents } = budgetLineStatus(row.effectiveBudgetedCents, row.actualCents);
  const variant = toneVariant(tone);
  const origin = describeBudgetOrigin(row.origin);
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{formatCurrency(Math.abs(row.actualCents))}</span>
        <span className="text-sm text-muted-foreground tabular-nums">{ratio === null ? "sin presupuesto" : `de ${formatCurrency(row.effectiveBudgetedCents)}`}</span>
      </div>
      {ratio !== null && (
        <>
          <Progress value={barValue} variant={variant} aria-label={`Avance de ${row.name}`} className="h-2" />
          <Badge variant={variant} className="w-fit tabular-nums">
            {leftCents < 0 ? `Se pasó por ${formatCurrency(-leftCents)}` : `Quedan ${formatCurrency(leftCents)}`}
          </Badge>
        </>
      )}
      {origin && <p className="text-xs text-muted-foreground">{origin}</p>}
    </div>
  );
}

function SubLineRow({ row, setLineAction, deleteLineAction }: { row: BudgetRow } & Actions) {
  const { isPending, submit, remove } = useRowAction(setLineAction, deleteLineAction);
  const { ratio, barValue, tone } = budgetLineStatus(row.effectiveBudgetedCents, row.actualCents);
  const variant = toneVariant(tone);
  return (
    <li className="flex min-w-0 flex-col gap-2 p-3">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <span className="size-2 shrink-0 rounded-full" style={{ background: row.color }} />
          <span className="truncate">{row.name}</span>
        </span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {formatCurrency(Math.abs(row.actualCents))}
          {ratio === null ? " · sin presupuesto" : ` de ${formatCurrency(row.effectiveBudgetedCents)}`}
        </span>
      </div>
      {ratio !== null && <Progress value={barValue} variant={variant} aria-label={`Avance de ${row.name}`} className="h-1" />}
      <form onSubmit={submit} className="flex items-center gap-2">
        <input type="hidden" name={FIELD.categoryId} value={row.categoryId} />
        <input type="hidden" name={FIELD.cadence} value={row.cadence} />
        <span className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground">$</span>
          <Input name={FIELD.amount} type="number" step="0.01" min="0.01" placeholder="0.00" aria-label={`Monto de ${row.name}`} defaultValue={row.manualBudgetedAmountCents > 0 ? String(row.manualBudgetedAmountCents / 100) : undefined} required className="h-8 pl-5 text-base tabular-nums md:text-sm" />
        </span>
        <Button type="submit" size="sm" disabled={isPending}>
          Guardar
        </Button>
        {row.manualBudgetedAmountCents > 0 && (
          <Button type="button" variant="ghost" size="sm" disabled={isPending} aria-label={`Quitar presupuesto de ${row.name}`} onClick={() => remove(row.categoryId)}>
            Quitar
          </Button>
        )}
      </form>
    </li>
  );
}

export interface BudgetCategoryDialogProps extends Actions {
  parent: BudgetRow | null;
  subRows: BudgetRow[];
  onClose: () => void;
}

export function BudgetCategoryDialog({ parent, subRows, onClose, setLineAction, deleteLineAction }: BudgetCategoryDialogProps) {
  return (
    <ResponsiveDialog title={parent ? `Presupuesto — ${parent.name}` : "Presupuesto"} description={parent ? describeCategory(parent.name, parent.description) : undefined} size="md" open={parent !== null} onOpenChange={(open) => !open && onClose()}>
      {parent && (
        <>
          <BudgetHeadline row={parent} />
          <BudgetLineForm key={`${parent.categoryId}-${parent.manualBudgetedAmountCents}`} row={parent} title={subRows.length > 0 ? "Presupuesto de la categoría" : "Presupuesto"} setLineAction={setLineAction} deleteLineAction={deleteLineAction} />
          {subRows.length > 0 && (
            <section aria-label="Subcategorías" className="flex flex-col gap-4 border-t pt-4">
              <h3 className="text-sm font-semibold">Subcategorías</h3>
              <ul className="flex min-w-0 flex-col divide-y rounded-xl border">
                {subRows.map((child) => (
                  <SubLineRow key={`${child.categoryId}-${child.manualBudgetedAmountCents}`} row={child} setLineAction={setLineAction} deleteLineAction={deleteLineAction} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </ResponsiveDialog>
  );
}
