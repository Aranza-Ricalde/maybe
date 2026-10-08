"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { FormAction } from "@/lib/actionResult";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/molecules/ProgressRing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BudgetCadence } from "@/domain/budget/rules";
import { summarizeBudget, type BudgetOrigin } from "@/domain/budget/overview";
import type { ResolvedCategoryDescription } from "@/domain/categories/descriptions";
import { budgetLineStatus, budgetSummaryView, groupBudgetRows } from "@/lib/presenters/budgets";
import { formatCurrency } from "@/lib/format";
import { BudgetCategoryDialog } from "./BudgetCategoryDialog";

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
  ownCapCents: number;
  unallocatedCents: number;
  isRaisedByChildren: boolean;
  isDerivedFromChildren: boolean;
  isSuggestedByRecurring: boolean;
  parentId: number | null;
  hasChildren: boolean;
  origin: BudgetOrigin;
  description: ResolvedCategoryDescription;
  isSavings: boolean;
}

export interface BudgetsTableProps {
  rows: BudgetRow[];
  aside?: ReactNode;
  setLineAction: FormAction;
  deleteLineAction: FormAction;
}

function BudgetRingTile({ row, onOpen }: { row: BudgetRow; onOpen: (categoryId: number) => void }) {
  const { ratio, ringPercent, over } = budgetLineStatus(row.effectiveBudgetedCents, row.actualCents);
  return (
    <li>
      <button type="button" aria-label={`Editar presupuesto de ${row.name}`} onClick={() => onOpen(row.categoryId)} className="group flex w-full flex-col items-center gap-2 rounded-xl p-3 transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        <ProgressRing percent={ringPercent} over={over} muted={ratio === null} color={row.color} label={row.name} />
        <span className="text-center">
          <span className="block text-sm font-medium">{row.name}</span>
          {row.isSavings && <span className="block text-[11px] text-muted-foreground">Ahorro · no cuenta como gasto</span>}
          <span className="block text-xs text-muted-foreground tabular-nums">
            {formatCurrency(Math.abs(row.actualCents))}
            {ratio === null ? " · sin presupuesto" : ` / ${formatCurrency(row.effectiveBudgetedCents)}`}
          </span>
        </span>
      </button>
    </li>
  );
}

function BudgetSummaryCard({ rows }: { rows: BudgetRow[] }) {
  const summary = useMemo(() => summarizeBudget(rows), [rows]);
  const { ringPercent, remainingCents: remaining, over } = budgetSummaryView(summary.budgetedCents, summary.spentCents);
  return (
    <Card aria-label="Resumen del presupuesto">
      <CardHeader>
        <CardTitle>Resumen del periodo</CardTitle>
        <CardDescription>{summary.overCount > 0 ? `${summary.overCount} ${summary.overCount === 1 ? "categoría se pasó" : "categorías se pasaron"}` : "Ninguna categoría se pasó"}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <ProgressRing percent={ringPercent} over={over} label="Presupuesto total" className="size-24" />
          <div>
            <p className="text-xs text-muted-foreground">{remaining >= 0 ? "Te queda" : "Te pasaste por"}</p>
            <p className={`text-2xl font-semibold tracking-tight tabular-nums ${remaining >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(Math.abs(remaining))}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 border-t pt-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Presupuestado</dt>
            <dd className="font-semibold tabular-nums">{formatCurrency(summary.budgetedCents)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Gastado</dt>
            <dd className="font-semibold tabular-nums">{formatCurrency(summary.spentCents)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

export function BudgetsTable({ rows, aside, setLineAction, deleteLineAction }: BudgetsTableProps) {
  const { budgeted, unbudgeted, childrenOf } = useMemo(() => groupBudgetRows(rows), [rows]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [showUnbudgeted, setShowUnbudgeted] = useState(true);
  const selected = [...budgeted, ...unbudgeted].find((row) => row.categoryId === openId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BudgetSummaryCard rows={rows} />
        {aside}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Presupuestos del periodo</CardTitle>
          <CardDescription>Toca una categoría para ver el detalle y cambiar su presupuesto. En rojo, las que ya se pasaron.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <ul aria-label="Presupuesto por categoría" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {budgeted.map((row) => (
              <BudgetRingTile key={row.categoryId} row={row} onOpen={setOpenId} />
            ))}
          </ul>
          {unbudgeted.length > 0 && (
            <div className="flex flex-col gap-2 border-t pt-4">
              <Button type="button" variant="ghost" size="sm" aria-expanded={showUnbudgeted} onClick={() => setShowUnbudgeted((shown) => !shown)} className="-ml-2 w-fit gap-1.5 text-xs font-medium tracking-[0.07em] text-muted-foreground uppercase">
                {showUnbudgeted ? <ChevronDown className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}
                Sin presupuesto ({unbudgeted.length})
              </Button>
              {showUnbudgeted && <ul aria-label="Categorías sin presupuesto" className="flex flex-col divide-y rounded-xl border">
                {unbudgeted.map((row) => (
                  <li key={row.categoryId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: row.color }} />
                      <span className="truncate font-medium">{row.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatCurrency(Math.abs(row.actualCents))} gastado</span>
                    </span>
                    <Button type="button" variant="outline" size="sm" aria-label={`Editar presupuesto de ${row.name}`} onClick={() => setOpenId(row.categoryId)}>
                      Definir presupuesto
                    </Button>
                  </li>
                ))}
              </ul>}
            </div>
          )}
        </CardContent>
      </Card>
      <BudgetCategoryDialog
        parent={selected}
        subRows={selected ? childrenOf(selected.categoryId) : []}
        onClose={() => setOpenId(null)}
        setLineAction={setLineAction}
        deleteLineAction={deleteLineAction}
      />
    </div>
  );
}
