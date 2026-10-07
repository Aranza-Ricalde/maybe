"use client";

import { ChevronDown, ChevronRight, TriangleExclamationFill } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { useMemo, useState } from "react";
import { Chip } from "@/components/atoms/Chip";
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

type VisibleBudgetRow = BudgetRow & { isExpanded: boolean; childrenOverCount: number };

export interface BudgetsTableProps {
  rows: BudgetRow[];
  setLineAction: (formData: FormData) => Promise<void> | void;
  deleteLineAction: (formData: FormData) => Promise<void> | void;
}

const BAR_TONE = { success: "bg-success", warning: "bg-warning", danger: "bg-danger" } as const;
const HEADER_CELL = "px-4 py-3 text-xs font-medium text-muted";

function ProgressCell({ budgetedCents, actualCents }: { budgetedCents: number; actualCents: number }) {
  const percent = computeBudgetPercent(budgetedCents, actualCents);
  if (percent === null)
    return (
      <div className="flex justify-end">
        <Text size="xs" tone="muted">Sin presupuestar</Text>
      </div>
    );
  const tone = classifyBudgetProgress(percent);
  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-separator" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(percent * 100))}>
        <div className={`h-full rounded-full ${BAR_TONE[tone]}`} style={{ width: `${Math.min(100, percent * 100)}%` }} />
      </div>
      <Chip tone={tone} className="tabular-nums">
        {percent > 1 ? `Se pasó · ${formatPercent(percent)}` : formatPercent(percent)}
      </Chip>
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

export function BudgetsTable({ rows, setLineAction, deleteLineAction }: BudgetsTableProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set());
  const summary = useMemo(() => summarizeBudget(rows), [rows]);
  const parentsWithChildren = rows.filter((row) => row.hasChildren);
  const allExpanded = parentsWithChildren.length > 0 && parentsWithChildren.every((row) => expanded.has(row.categoryId));
  const childrenOver = useMemo(() => {
    const counts = new Map<number, number>();
    for (const row of rows) {
      if (row.parentId != null && row.effectiveBudgetedCents > 0 && Math.abs(row.actualCents) > row.effectiveBudgetedCents) counts.set(row.parentId, (counts.get(row.parentId) ?? 0) + 1);
    }
    return counts;
  }, [rows]);

  const visibleRows: VisibleBudgetRow[] = useMemo(
    () => rows.filter((row) => row.parentId == null || expanded.has(row.parentId)).map((row) => ({ ...row, isExpanded: expanded.has(row.categoryId), childrenOverCount: childrenOver.get(row.categoryId) ?? 0 })),
    [rows, expanded, childrenOver],
  );

  function toggle(categoryId: number) {
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(categoryId)) next.add(categoryId);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-separator px-5 py-4">
        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
          <div className="flex flex-col">
            <Text size="xs" tone="muted">Presupuestado</Text>
            <span className="text-lg font-semibold tabular-nums">{formatCurrency(summary.budgetedCents)}</span>
          </div>
          <div className="flex flex-col">
            <Text size="xs" tone="muted">Gastado</Text>
            <span className="text-lg font-semibold tabular-nums">{formatCurrency(summary.spentCents)}</span>
          </div>
          {summary.overCount > 0 && (
            <Text size="sm" tone="danger" className="flex items-center gap-1">
              <Icon icon={TriangleExclamationFill} size="sm" />
              {summary.overCount} {summary.overCount === 1 ? "categoría se pasó" : "categorías se pasaron"}
            </Text>
          )}
        </div>
        {parentsWithChildren.length > 0 && (
          <Button size="sm" variant="secondary" onPress={() => setExpanded(allExpanded ? new Set() : new Set(parentsWithChildren.map((row) => row.categoryId)))}>
            {allExpanded ? "Contraer todo" : "Expandir todo"}
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <Text tone="muted" className="py-6 text-center">Crea categorías en Configuración para poder presupuestar.</Text>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-separator">
          <table aria-label="Presupuesto por categoría" className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-separator text-left">
                <th scope="col" className={HEADER_CELL}>Categoría</th>
                <th scope="col" className={`${HEADER_CELL} text-right`}>Gastado</th>
                <th scope="col" className={`${HEADER_CELL} text-right`}>Presupuestado</th>
                <th scope="col" className={`${HEADER_CELL} text-right`}>Progreso</th>
                <th scope="col" className={`${HEADER_CELL} text-right`}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator">
              {visibleRows.map((c) => (
                <tr key={c.categoryId} className={c.depth === 1 ? "bg-surface-secondary/40" : ""}>
                  <th scope="row" className="px-4 py-3 text-left font-normal">
                    <div className="flex items-center gap-1">
                      {c.hasChildren ? (
                        <Button isIconOnly size="sm" variant="ghost" aria-label={`${c.isExpanded ? "Contraer" : "Expandir"} subcategorías de ${c.name}`} aria-expanded={c.isExpanded} onPress={() => toggle(c.categoryId)}>
                          <Icon icon={c.isExpanded ? ChevronDown : ChevronRight} />
                        </Button>
                      ) : (
                        c.depth === 0 && <span className="inline-block size-8 shrink-0" aria-hidden />
                      )}
                      <div className={`flex flex-col ${c.depth === 1 ? "pl-6" : ""}`}>
                        <div className="flex items-center gap-1">
                          <span className="size-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                          <span className={c.depth === 0 ? "font-medium" : ""}>{c.name}</span>
                          <InfoTooltip label={describeCategory(c.name, c.description)} ariaLabel={`¿Qué va en ${c.name}?`} />
                        </div>
                        {c.hasChildren && !c.isExpanded && c.childrenOverCount > 0 && (
                          <span className="flex items-center gap-1 pl-4 text-xs text-danger">
                            <Icon icon={TriangleExclamationFill} size="xs" />
                            {c.childrenOverCount} {c.childrenOverCount === 1 ? "subcategoría se pasó" : "subcategorías se pasaron"}
                          </span>
                        )}
                      </div>
                    </div>
                  </th>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <CurrencyText cents={c.actualCents} absolute />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <BudgetedCell row={c} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ProgressCell budgetedCents={c.effectiveBudgetedCents} actualCents={c.actualCents} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <BudgetLineModal categoryId={c.categoryId} categoryName={c.name} cadence={c.cadence} budgetedAmountCents={c.manualBudgetedAmountCents} action={setLineAction} />
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
