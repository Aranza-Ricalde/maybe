import type { FormAction } from "@/lib/actionResult";
import { ChevronDown } from "lucide-react";
import { Text } from "@/components/atoms/Text";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { CashProjectionView } from "@/application/getCashProjection";
import { sumEventsCents } from "@/domain/cashflow/daily";
import { formatPesos, formatShortDate, formatSignedPesos } from "@/lib/format";
import { MinimumBalanceModal } from "./MinimumBalanceModal";

const MAX_LISTED_EVENTS = 12;
const amountTone = (cents: number) => (cents > 0 ? "text-success" : "text-foreground");

export function ProjectionDetails({ view, minimumAction }: { view: CashProjectionView; minimumAction: FormAction }) {
  const { projection, assumptions } = view;
  const listed = projection.events.slice(0, MAX_LISTED_EVENTS);
  const hidden = projection.events.length - listed.length;

  return (
    <section className="flex flex-col gap-3" aria-label="Detalle de la proyección">
      <Collapsible>
        <CollapsibleTrigger render={<Button type="button" variant="ghost" size="sm" className="group -ml-2 w-fit" />}>
            Ver los {projection.events.length} movimientos esperados
            <ChevronDown className="transition-transform group-data-[panel-open]:rotate-180" />
          </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="mt-2 flex flex-col divide-y divide-border text-sm">
            {listed.map((event, index) => (
              <li key={`${event.date}-${event.label}-${index}`} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0 truncate">
                  {event.label} <span className="text-xs text-muted-foreground">· {formatShortDate(event.date)}</span>
                </span>
                <span className={`shrink-0 tabular-nums ${amountTone(event.amountCents)}`}>{formatSignedPesos(event.amountCents)}</span>
              </li>
            ))}
            {hidden > 0 && (
              <li className="py-2 text-xs text-muted-foreground">
                y {hidden} {hidden === 1 ? "movimiento esperado más" : "movimientos esperados más"} ({formatSignedPesos(sumEventsCents(projection.events.slice(MAX_LISTED_EVENTS)))})
              </li>
            )}
            <li className="flex items-center justify-between py-2.5">
              <span>Gasto variable estimado</span>
              <span className="tabular-nums">{formatSignedPesos(projection.variableCents)}</span>
            </li>
          </ul>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex flex-col gap-1">
        <Text size="xs" tone="muted">
          Supuestos: incluye {assumptions.recurringCount} {assumptions.recurringCount === 1 ? "recurrente" : "recurrentes"}
          {assumptions.overdueCount > 0 && `, ${assumptions.overdueCount} ${assumptions.overdueCount === 1 ? "pago pendiente o atrasado" : "pagos pendientes o atrasados"}`} y {assumptions.scheduledCount} {assumptions.scheduledCount === 1 ? "pago programado" : "pagos programados"}.
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
    </section>
  );
}
