"use client";

import type { FormAction } from "@/lib/actionResult";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DeleteEntityButton } from "./DeleteEntityButton";
import { GoalModal } from "./GoalModal";
import { formatCurrency } from "@/lib/format";
import { goalProgress } from "@/domain/dashboard/rules";
import type { AccountOption } from "@/components/viewModels";

export interface GoalRow {
  id: number;
  name: string;
  targetAmountCents: number;
  targetDate: string | null;
  currentCents: number;
  projection: { headline: string; detail?: string } | null;
  linkedAccountNames: string[];
  linkedAccountIds: number[];
}

export interface GoalsTableProps {
  rows: GoalRow[];
  accounts: AccountOption[];
  updateAction: FormAction;
  deleteAction: FormAction;
}

export function GoalsTable({ rows, accounts, updateAction, deleteAction }: GoalsTableProps) {
  return (
    <ul aria-label="Metas" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {rows.map((g) => {
        const { currentCents: current, percent } = goalProgress(g.currentCents, g.targetAmountCents);
        const pct = Math.round(percent * 100);
        const reached = percent >= 1;
        return (
          <li key={g.id}>
            <Card size="sm" className="h-full">
              <CardHeader>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <CardTitle className="truncate">{g.name}</CardTitle>
                  {reached && <Badge variant="success" className="w-fit">Meta cumplida</Badge>}
                </div>
                <CardAction className="flex items-center gap-1">
                  <GoalModal
                    mode="edit"
                    accounts={accounts}
                    action={updateAction}
                    initialValues={{ id: g.id, name: g.name, targetAmountCents: g.targetAmountCents, targetDate: g.targetDate, linkedAccountIds: g.linkedAccountIds }}
                  />
                  <DeleteEntityButton noun="meta" name={g.name} id={g.id}
                    helperText="Tus cuentas y movimientos no se tocan — solo se borra esta meta y sus vínculos."
                    action={deleteAction}
                  />
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <CurrencyText cents={current} size="base" weight="semibold" className="text-xl" />
                    <Text size="sm" tone="muted" className="tabular-nums">
                      de {formatCurrency(g.targetAmountCents)} · {pct}%
                    </Text>
                  </div>
                  <Progress value={Math.min(100, pct)} variant={reached ? "success" : "default"} aria-label={`Avance de ${g.name}`} className="h-1.5" />
                </div>
                {g.projection && (
                  <div className="flex flex-col gap-0.5">
                    <Text size="sm" weight="medium">
                      {g.projection.headline}
                    </Text>
                    {g.projection.detail && (
                      <Text size="xs" tone="muted">
                        {g.projection.detail}
                      </Text>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-1.5">
                  {g.linkedAccountNames.length > 0 ? (
                    g.linkedAccountNames.map((name) => (
                      <Badge key={name} variant="outline">
                        {name}
                      </Badge>
                    ))
                  ) : (
                    <Text size="xs" tone="muted">
                      Sin cuentas ligadas
                    </Text>
                  )}
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
