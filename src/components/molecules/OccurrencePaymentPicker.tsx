"use client";

import { ActionForm } from "@/components/molecules/ActionForm";
import type { FormAction } from "@/lib/actionResult";
import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemSeparator, ItemTitle } from "@/components/ui/item";
import { Fragment } from "react";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { FIELD } from "@/lib/formFields";
import { ResponsiveDialog } from "./ResponsiveDialog";

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
  candidates: PaymentCandidateView[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkAction: FormAction;
}

function describeFit(c: PaymentCandidateView): string {
  const amount = c.amountDiffCents === 0 ? "mismo monto" : `${formatCurrency(c.amountDiffCents)} de diferencia`;
  const days = c.daysApart === 0 ? "el día esperado" : `${c.daysApart} ${c.daysApart === 1 ? "día" : "días"} de diferencia`;
  return `${amount} · ${days}`;
}

export function OccurrencePaymentPicker({ occurrenceId, candidates, open, onOpenChange, linkAction }: OccurrencePaymentPickerProps) {
  return (
    <ResponsiveDialog title="¿Cuál movimiento fue?" description="Elige el movimiento que ya pagó esta ocurrencia." open={open} onOpenChange={onOpenChange} size="md">
      {candidates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay movimientos cercanos que puedan ser este pago. Puedes usar “Marcar pagado” sin elegir uno.</p>
      ) : (
        <ItemGroup>
          {candidates.map((c, index) => (
            <Fragment key={c.id}>
              {index > 0 && <ItemSeparator />}
              <Item size="sm">
                <ItemContent>
                  <ItemTitle>{c.name}</ItemTitle>
                  <ItemDescription>
                    {c.accountName} · {formatShortDate(c.date)} · {describeFit(c)}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <span className="text-sm font-semibold tabular-nums">{formatCurrency(Math.abs(c.amountCents))}</span>
                  <ActionForm action={linkAction}>
                    <input type="hidden" name={FIELD.occurrenceId} value={occurrenceId} />
                    <input type="hidden" name={FIELD.transactionId} value={c.id} />
                    <Button type="submit" size="sm">
                      Es este
                    </Button>
                  </ActionForm>
                </ItemActions>
              </Item>
            </Fragment>
          ))}
        </ItemGroup>
      )}
    </ResponsiveDialog>
  );
}
