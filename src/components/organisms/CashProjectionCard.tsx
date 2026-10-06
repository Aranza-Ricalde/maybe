import { Card } from "@heroui/react";
import { Text } from "@/components/atoms/Text";
import type { CashProjectionView } from "@/application/getCashProjection";
import { sumEventsCents } from "@/domain/cashflow/daily";
import { formatPesos, formatShortDate } from "@/lib/format";
import { FinancialStatusBanner } from "./FinancialStatusBanner";
import { LineEvolutionChart } from "./LineEvolutionChart";
import { MinimumBalanceModal } from "./MinimumBalanceModal";

const MAX_LISTED_EVENTS = 12;
const signed = (cents: number) => `${cents >= 0 ? "+" : "−"}${formatPesos(Math.abs(cents))}`;
const tone = (cents: number) => (cents > 0 ? "text-success" : "text-foreground");

export function CashProjectionCard({ view, minimumAction }: { view: CashProjectionView; minimumAction: (formData: FormData) => Promise<void> | void }) {
  const { projection, assumptions } = view;
  const listed = projection.events.slice(0, MAX_LISTED_EVENTS);
  const hidden = projection.events.length - listed.length;
  const last = projection.series[projection.series.length - 1];

  return (
    <Card className="p-5">
      <Card.Header>
        <Card.Title>Tu saldo en los próximos {view.days} días</Card.Title>
        <Card.Description>Desde tu saldo en cuentas de débito y efectivo, con lo que esperas que entre y salga.</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <FinancialStatusBanner status={view.status} />

        <LineEvolutionChart
          series={projection.series.map((p) => ({ date: p.date, value: p.balanceCents }))}
          dateGranularity="daily"
          emptyMessage="No hay datos para proyectar."
          tableCaption={`Saldo proyectado a ${view.days} días`}
        />

        <ul className="flex flex-col divide-y divide-separator text-sm">
          <li className="flex items-center justify-between py-2 first:pt-0">
            <span className="font-medium">Hoy</span>
            <span className="font-semibold tabular-nums">{formatPesos(assumptions.startBalanceCents)}</span>
          </li>
          {listed.map((e, i) => (
            <li key={`${e.date}-${e.label}-${i}`} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate">
                {e.label} <span className="text-xs text-muted">· {formatShortDate(e.date)}</span>
              </span>
              <span className={`shrink-0 tabular-nums ${tone(e.amountCents)}`}>{signed(e.amountCents)}</span>
            </li>
          ))}
          {hidden > 0 && (
            <li className="py-2 text-xs text-muted">y {hidden} {hidden === 1 ? "movimiento esperado más" : "movimientos esperados más"} ({signed(sumEventsCents(projection.events.slice(MAX_LISTED_EVENTS)))})</li>
          )}
          <li className="flex items-center justify-between py-2">
            <span>Gasto variable estimado</span>
            <span className="tabular-nums">{signed(projection.variableCents)}</span>
          </li>
          <li className="flex items-center justify-between py-2 last:pb-0">
            <span className="font-medium">Saldo proyectado al {formatShortDate(last.date)}</span>
            <span className={`font-semibold tabular-nums ${projection.endBalanceCents < view.minimumCents ? "text-danger" : ""}`}>{formatPesos(projection.endBalanceCents)}</span>
          </li>
        </ul>

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
      </Card.Content>
    </Card>
  );
}
