import type { FormAction } from "@/lib/actionResult";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/atoms/Text";
import type { CashProjectionView } from "@/application/getCashProjection";
import { sumEventsCents } from "@/domain/cashflow/daily";
import { formatPesos, formatShortDate, formatSignedPesos } from "@/lib/format";
import { FinancialStatusBanner } from "./FinancialStatusBanner";
import { LineEvolutionChart } from "./LineEvolutionChart";
import { MinimumBalanceModal } from "./MinimumBalanceModal";

const MAX_LISTED_EVENTS = 12;
const tone = (cents: number) => (cents > 0 ? "text-success" : "text-foreground");

export function CashProjectionCard({ view, minimumAction }: { view: CashProjectionView; minimumAction: FormAction }) {
  const { projection, assumptions } = view;
  const listed = projection.events.slice(0, MAX_LISTED_EVENTS);
  const hidden = projection.events.length - listed.length;
  const last = projection.series[projection.series.length - 1];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tu saldo en los próximos {view.days} días</CardTitle>
        <CardDescription>Desde tu saldo en cuentas de débito y efectivo, con lo que esperas que entre y salga.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FinancialStatusBanner status={view.status} />

        <LineEvolutionChart
          series={projection.series.map((p) => ({ date: p.date, value: p.balanceCents }))}
          dateGranularity="daily"
          emptyMessage="No hay datos para proyectar."
          tableCaption={`Saldo proyectado a ${view.days} días`}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-0.5">
            <Text size="xs" tone="muted">Hoy</Text>
            <p className="text-xl font-semibold tabular-nums">{formatPesos(assumptions.startBalanceCents)}</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <Text size="xs" tone="muted">Cambio esperado</Text>
            <p className={`text-xl font-semibold tabular-nums ${projection.endBalanceCents - assumptions.startBalanceCents >= 0 ? "text-success" : ""}`}>{formatSignedPesos(projection.endBalanceCents - assumptions.startBalanceCents)}</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <Text size="xs" tone="muted">Saldo al {formatShortDate(last.date)}</Text>
            <p className={`text-xl font-semibold tabular-nums ${projection.endBalanceCents < view.minimumCents ? "text-danger" : ""}`}>{formatPesos(projection.endBalanceCents)}</p>
          </div>
        </div>

        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="group w-fit">
              Ver los {projection.events.length} movimientos esperados
              <ChevronDown className="transition-transform group-data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="mt-2 flex flex-col divide-y divide-border text-sm">
              {listed.map((e, i) => (
                <li key={`${e.date}-${e.label}-${i}`} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">
                    {e.label} <span className="text-xs text-muted-foreground">· {formatShortDate(e.date)}</span>
                  </span>
                  <span className={`shrink-0 tabular-nums ${tone(e.amountCents)}`}>{formatSignedPesos(e.amountCents)}</span>
                </li>
              ))}
              {hidden > 0 && (
                <li className="py-2 text-xs text-muted-foreground">y {hidden} {hidden === 1 ? "movimiento esperado más" : "movimientos esperados más"} ({formatSignedPesos(sumEventsCents(projection.events.slice(MAX_LISTED_EVENTS)))})</li>
              )}
              <li className="flex items-center justify-between py-2">
                <span>Gasto variable estimado</span>
                <span className="tabular-nums">{formatSignedPesos(projection.variableCents)}</span>
              </li>
            </ul>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex flex-col gap-1">
          <Text size="xs" tone="muted">
            Supuestos: incluye {assumptions.recurringCount} {assumptions.recurringCount === 1 ? "recurrente" : "recurrentes"}
            {assumptions.overdueCount > 0 && `, ${assumptions.overdueCount} ${assumptions.overdueCount === 1 ? "pago pendiente o atrasado" : "pagos pendientes o atrasados"}`} y {assumptions.scheduledCount}{" "}
            {assumptions.scheduledCount === 1 ? "pago programado" : "pagos programados"}.
          </Text>
          <Text size="xs" tone="muted">
            Estima {formatPesos(Math.abs(assumptions.dailyVariableCents))} de gasto variable por día, según el promedio de tus últimos 3 meses. Es una estimación, no una certeza.
          </Text>
          <div className="flex flex-wrap items-center gap-x-2">
            <Text size="xs" tone="muted">
              El aviso usa un saldo mínimo de {formatPesos(view.minimumCents)}.
            </Text>
            <MinimumBalanceModal minimumCents={view.minimumCents} action={minimumAction} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
