"use client";

import { useState } from "react";
import { Text } from "@/components/atoms/Text";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { AccountOption } from "@/components/viewModels";
import { goalProgress } from "@/domain/dashboard/rules";
import type { FormAction } from "@/lib/actionResult";
import { formatCurrency } from "@/lib/format";
import { DeleteEntityButton } from "./DeleteEntityButton";
import { GoalModal } from "./GoalModal";
import type { GoalRow } from "./GoalsTable";

export interface GoalsListProps {
  rows: GoalRow[];
  accounts: AccountOption[];
  updateAction: FormAction;
  deleteAction: FormAction;
}

function GoalListItem({ goal, accounts, updateAction, deleteAction }: Omit<GoalsListProps, "rows"> & { goal: GoalRow }) {
  const [open, setOpen] = useState(false);
  const { currentCents, percent } = goalProgress(goal.currentCents, goal.targetAmountCents);
  const pct = Math.round(percent * 100);
  const reached = percent >= 1;
  const missing = Math.max(0, goal.targetAmountCents - currentCents);

  return (
    <li>
      <button type="button" aria-expanded={open} aria-label={`Abrir meta ${goal.name}`} onClick={() => setOpen((value) => !value)} className="flex w-full flex-col gap-1.5 py-3 text-left">
        <span className="flex items-center justify-between gap-3">
          <span className="min-w-0 text-sm font-medium break-words">{goal.name}</span>
          <span className={`shrink-0 text-sm font-semibold tabular-nums ${reached ? "text-success" : ""}`}>{reached ? "Meta cumplida" : `Faltan ${formatCurrency(missing)}`}</span>
        </span>
        <Progress value={Math.min(100, pct)} variant={reached ? "success" : "default"} aria-label={`Avance de ${goal.name}`} className="h-1.5" />
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatCurrency(currentCents)} de {formatCurrency(goal.targetAmountCents)} · {pct}%
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 pb-3">
          {goal.projection && (
            <div className="flex flex-col gap-0.5">
              <Text size="sm" weight="medium">{goal.projection.headline}</Text>
              {goal.projection.detail && <Text size="xs" tone="muted">{goal.projection.detail}</Text>}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            {goal.linkedAccountNames.length > 0 ? goal.linkedAccountNames.map((name) => <Badge key={name} variant="outline">{name}</Badge>) : <Text size="xs" tone="muted">Sin cuentas ligadas</Text>}
          </div>
          <div className="flex items-center justify-end gap-1">
            <GoalModal mode="edit" accounts={accounts} action={updateAction} initialValues={{ id: goal.id, name: goal.name, targetAmountCents: goal.targetAmountCents, targetDate: goal.targetDate, linkedAccountIds: goal.linkedAccountIds }} />
            <DeleteEntityButton noun="meta" name={goal.name} id={goal.id} helperText="Tus cuentas y movimientos no se tocan — solo se borra esta meta y sus vínculos." action={deleteAction} />
          </div>
        </div>
      )}
    </li>
  );
}

export function GoalsList({ rows, ...actions }: GoalsListProps) {
  return (
    <ul aria-label="Lista de metas" className="flex flex-col divide-y md:hidden">
      {rows.map((goal) => (
        <GoalListItem key={goal.id} goal={goal} {...actions} />
      ))}
    </ul>
  );
}
