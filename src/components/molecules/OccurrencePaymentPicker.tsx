"use client";

import { Button } from "@heroui/react";
import { useState, useTransition } from "react";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { FIELD } from "@/lib/formFields";

export interface PaymentCandidateView {
  id: number;
  name: string;
  accountName: string;
  date: string;
  amountCents: number;
  daysApart: number;
  amountDiffCents: number;
}

export interface OccurrencePaymentPickerProps {
  occurrenceId: number;
  listCandidates: (occurrenceId: number) => Promise<PaymentCandidateView[]>;
  linkAction: (formData: FormData) => void;
}

function describeFit(c: PaymentCandidateView): string {
  const amount = c.amountDiffCents === 0 ? "mismo monto" : `${formatCurrency(c.amountDiffCents)} de diferencia`;
  const days = c.daysApart === 0 ? "el día esperado" : `${c.daysApart} ${c.daysApart === 1 ? "día" : "días"} de diferencia`;
  return `${amount} · ${days}`;
}

export function OccurrencePaymentPicker({ occurrenceId, listCandidates, linkAction }: OccurrencePaymentPickerProps) {
  const [candidates, setCandidates] = useState<PaymentCandidateView[] | null>(null);
  const [isPending, startTransition] = useTransition();

  if (candidates === null) {
    return (
      <Button
        size="sm"
        variant="ghost"
        isDisabled={isPending}
        onPress={() => startTransition(async () => setCandidates(await listCandidates(occurrenceId)))}
      >
        {isPending ? "Buscando…" : "Elegir movimiento"}
      </Button>
    );
  }

  return (
    <div className="order-last mt-1 basis-full rounded-lg border border-separator bg-surface-secondary p-3 text-left">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium">¿Cuál movimiento fue?</p>
        <Button size="sm" variant="ghost" onPress={() => setCandidates(null)}>
          Cerrar
        </Button>
      </div>
      {candidates.length === 0 ? (
        <p className="text-xs text-muted">No hay movimientos cercanos que puedan ser este pago. Puedes usar “Marcar pagado” sin elegir uno.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-separator">
          {candidates.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted">
                  {c.accountName} · {formatShortDate(c.date)} · {describeFit(c)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold tabular-nums">{formatCurrency(Math.abs(c.amountCents))}</span>
                <form action={linkAction}>
                  <input type="hidden" name={FIELD.occurrenceId} value={occurrenceId} />
                  <input type="hidden" name={FIELD.transactionId} value={c.id} />
                  <Button type="submit" size="sm" variant="primary">
                    Es este
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
