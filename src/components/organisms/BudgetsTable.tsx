"use client";

import type { FormAction } from "@/lib/actionResult";
import { ChevronDown, ChevronRight, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { useBudgetTree } from "@/hooks/useBudgetTree";
import { useIsMobile } from "@/hooks/use-mobile";
import { StatBlock } from "@/components/molecules/StatBlock";
import { StatBlockRow } from "@/components/molecules/StatBlockRow";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { budgetVsActualBars } from "@/lib/presenters/charts";
import { BudgetVsActualChart } from "./BudgetVsActualChart";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Icon } from "@/components/atoms/Icon";
import { Text } from "@/components/atoms/Text";
import { InfoTooltip } from "@/components/molecules/InfoTooltip";
import { classifyBudgetProgress, computeBudgetPercent, type BudgetCadence } from "@/domain/budget/rules";
import { summarizeBudget, type BudgetOrigin } from "@/domain/budget/overview";
import type { ResolvedCategoryDescription } from "@/domain/categories/descriptions";
import { describeBudgetOrigin, describeCategory } from "@/lib/budgetCopy";
import { formatCurrency, formatPercent } from "@/lib/format";
import { FIELD } from "@/lib/formFields";
import { BudgetLineModal } from "./BudgetLineModal";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";

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
}

export interface BudgetsTableProps {
  rows: BudgetRow[];
  setLineAction: FormAction;
  deleteLineAction: FormAction;
}

const PROGRESS_VARIANT = { success: "success", warning: "warning", danger: "destructive" } as const;

function ProgressCell({ budgetedCents, actualCents }: { budgetedCents: number; actualCents: number }) {
  const percent = computeBudgetPercent(budgetedCents, actualCents);
  if (percent === null)
    return (
      <div className="flex justify-end">
        <Text size="xs" tone="muted">Sin presupuestar</Text>
      </div>
    );
  const variant = PROGRESS_VARIANT[classifyBudgetProgress(percent)];
  return (
    <div className="flex flex-col items-end gap-1.5">
      <Progress value={Math.min(100, percent * 100)} variant={variant} aria-label="Avance del presupuesto" className="w-28" />
      <Badge variant={variant} className="tabular-nums">
        {percent > 1 ? `Se pasó · ${formatPercent(percent)}` : formatPercent(percent)}
      </Badge>
    </div>
  );
}

function BudgetedCell({ row }: { row: BudgetRow }) {
  if (row.effectiveBudgetedCents <= 0)
    return (
      <div className="flex justify-end">
        <Text tone="muted">—</Text>
      </div>
    );
  const origin = describeBudgetOrigin(row.origin);
  return (
    <div className="flex items-center justify-end gap-0.5">
      {origin && <InfoTooltip label={origin} ariaLabel={`¿De dónde sale el presupuesto de ${row.name}?`} />}
      <CurrencyText cents={row.effectiveBudgetedCents} tone={row.isRaisedByChildren ? "warning" : "default"} />
    </div>
  );
}


type VisibleRow = ReturnType<typeof useBudgetTree<BudgetRow>>["visibleRows"][number];

function BudgetCategoryName({ row, onToggle }: { row: VisibleRow; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-1">
      {row.hasChildren ? (
        <Button type="button" size="icon-sm" variant="ghost" aria-label={`${row.isExpanded ? "Contraer" : "Expandir"} subcategorías de ${row.name}`} aria-expanded={row.isExpanded} onClick={onToggle}>
          <Icon icon={row.isExpanded ? ChevronDown : ChevronRight} />
        </Button>
      ) : (
        row.depth === 0 && <span className="inline-block size-7 shrink-0" aria-hidden />
      )}
      <div className={`flex flex-col ${row.depth === 1 ? "pl-6" : ""}`}>
        <div className="flex items-center gap-1">
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: row.color }} />
          <span className={row.depth === 0 ? "font-medium" : ""}>{row.name}</span>
          <InfoTooltip label={describeCategory(row.name, row.description)} ariaLabel={`¿Qué va en ${row.name}?`} />
        </div>
        {row.hasChildren && !row.isExpanded && row.childrenOverCount > 0 && (
          <span className="flex items-center gap-1 pl-4 text-xs text-danger">
            <Icon icon={TriangleAlert} size="xs" />
            {row.childrenOverCount} {row.childrenOverCount === 1 ? "subcategoría se pasó" : "subcategorías se pasaron"}
          </span>
        )}
      </div>
    </div>
  );
}

interface BudgetRowActionsProps extends Pick<BudgetsTableProps, "setLineAction" | "deleteLineAction"> {
  row: VisibleRow;
}

function BudgetRowActions({ row, setLineAction, deleteLineAction }: BudgetRowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <BudgetLineModal categoryId={row.categoryId} categoryName={row.name} cadence={row.cadence} budgetedAmountCents={row.manualBudgetedAmountCents} action={setLineAction} />
      {row.manualBudgetedAmountCents > 0 && (
        <ConfirmDeleteButton
          title="Quitar presupuesto"
          triggerAriaLabel={`Quitar presupuesto de ${row.name}`}
          confirmQuestion={
            <>
              ¿Quitar el presupuesto de <span className="font-semibold">&ldquo;{row.name}&rdquo;</span>?
            </>
          }
          hiddenFields={{ [FIELD.categoryId]: row.categoryId }}
          action={deleteLineAction}
          submitLabel="Sí, quitar"
          pendingLabel="Quitando…"
        />
      )}
    </div>
  );
}

function BudgetMobileList({ rows, onToggle, setLineAction, deleteLineAction }: Pick<BudgetsTableProps, "setLineAction" | "deleteLineAction"> & { rows: VisibleRow[]; onToggle: (categoryId: number) => void }) {
  return (
    <ul aria-label="Presupuesto por categoría" className="flex flex-col divide-y rounded-xl border bg-card">
      {rows.map((row) => (
        <li key={row.categoryId} className={`flex flex-col gap-3 p-3 ${row.depth === 1 ? "bg-muted/40" : ""}`}>
          <div className="flex items-start justify-between gap-2">
            <BudgetCategoryName row={row} onToggle={() => onToggle(row.categoryId)} />
            <BudgetRowActions row={row} setLineAction={setLineAction} deleteLineAction={deleteLineAction} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex flex-col">
              <Text size="xs" tone="muted">Gastado</Text>
              <CurrencyText cents={row.actualCents} absolute weight="medium" />
            </div>
            <div className="flex flex-col items-end">
              <Text size="xs" tone="muted">Presupuestado</Text>
              <BudgetedCell row={row} />
            </div>
          </div>
          <ProgressCell budgetedCents={row.effectiveBudgetedCents} actualCents={row.actualCents} />
        </li>
      ))}
    </ul>
  );
}

export function BudgetsTable({ rows, setLineAction, deleteLineAction }: BudgetsTableProps) {
  const summary = useMemo(() => summarizeBudget(rows), [rows]);
  const tree = useBudgetTree(rows);
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-4">
      <StatBlockRow>
        <StatBlock label="Presupuestado" value={formatCurrency(summary.budgetedCents)} />
        <StatBlock label="Gastado" value={formatCurrency(summary.spentCents)} />
        <StatBlock
          label={summary.budgetedCents - summary.spentCents >= 0 ? "Te queda" : "Te pasaste por"}
          value={formatCurrency(Math.abs(summary.budgetedCents - summary.spentCents))}
          tone={summary.budgetedCents - summary.spentCents >= 0 ? "success" : "danger"}
          hint={
            summary.overCount > 0 ? (
              <Text size="sm" tone="danger" className="mt-1 flex items-center gap-1">
                <Icon icon={TriangleAlert} size="sm" />
                {summary.overCount} {summary.overCount === 1 ? "categoría se pasó" : "categorías se pasaron"}
              </Text>
            ) : (
              <Text size="xs" tone="muted" className="mt-1">
                Ninguna categoría se pasó
              </Text>
            )
          }
        />
      </StatBlockRow>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Presupuesto contra gasto</CardTitle>
            <CardDescription>En rojo, las categorías que ya se pasaron de su presupuesto.</CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetVsActualChart bars={budgetVsActualBars(rows)} />
          </CardContent>
        </Card>
      )}

      {tree.hasParents && (
        <div className="flex justify-end">
          <Button type="button" size="sm" variant="outline" onClick={tree.toggleAll}>
            {tree.allExpanded ? "Contraer todo" : "Expandir todo"}
          </Button>
        </div>
      )}

      {rows.length === 0 ? (
        <Text tone="muted" className="py-6 text-center">Crea categorías en Configuración para poder presupuestar.</Text>
      ) : (
        isMobile ? (
          <BudgetMobileList rows={tree.visibleRows} onToggle={tree.toggle} setLineAction={setLineAction} deleteLineAction={deleteLineAction} />
        ) : (
        <div className="rounded-xl border">
          <Table aria-label="Presupuesto por categoría" className="min-w-160">
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Gastado</TableHead>
                <TableHead className="text-right">Presupuestado</TableHead>
                <TableHead className="text-right">Progreso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tree.visibleRows.map((c) => (
                <TableRow key={c.categoryId} className={c.depth === 1 ? "bg-muted/40" : undefined}>
                  <TableCell>
                    <BudgetCategoryName row={c} onToggle={() => tree.toggle(c.categoryId)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <CurrencyText cents={c.actualCents} absolute />
                    </div>
                  </TableCell>
                  <TableCell>
                    <BudgetedCell row={c} />
                  </TableCell>
                  <TableCell>
                    <ProgressCell budgetedCents={c.effectiveBudgetedCents} actualCents={c.actualCents} />
                  </TableCell>
                  <TableCell>
                    <BudgetRowActions row={c} setLineAction={setLineAction} deleteLineAction={deleteLineAction} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )
      )}
    </div>
  );
}
