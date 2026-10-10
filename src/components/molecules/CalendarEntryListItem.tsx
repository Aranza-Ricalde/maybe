"use client";

import type { FormAction } from "@/lib/actionResult";
import { Check, EllipsisVertical } from "lucide-react";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Icon } from "@/components/atoms/Icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import type { CalendarEntry } from "@/domain/calendar/rules";
import { useOccurrenceActions } from "@/hooks/useOccurrenceActions";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DateTile } from "./DateTile";
import { OccurrencePaymentPicker, type PaymentCandidateView } from "./OccurrencePaymentPicker";

const SOURCE_LABEL: Record<CalendarEntry["source"], string> = { recurrente: "Recurrente", programado: "Programado", deuda: "Vencimiento de deuda" };

const STATUS_BADGE: Partial<Record<CalendarEntry["status"], { variant: "success" | "destructive" | "secondary"; label: string }>> = {
  paid: { variant: "success", label: "Pagado" },
  overdue: { variant: "destructive", label: "Atrasado" },
  skipped: { variant: "secondary", label: "Omitido" },
};

const REOPEN_LABEL: Partial<Record<CalendarEntry["status"], string>> = { paid: "Deshacer", skipped: "Restaurar" };

export interface CalendarEntryListItemProps {
  entry: CalendarEntry;
  decisionAction: FormAction;
  listPaymentCandidates: (occurrenceId: number) => Promise<PaymentCandidateView[]>;
  linkPaymentAction: FormAction;
}

export function CalendarEntryListItem({ entry, decisionAction, listPaymentCandidates, linkPaymentAction }: CalendarEntryListItemProps) {
  const { isPending, candidates, pickerOpen, setPickerOpen, decide, openPicker } = useOccurrenceActions({ occurrenceId: entry.occurrenceId, decisionAction, listPaymentCandidates });
  const badge = STATUS_BADGE[entry.status];
  const isPaid = entry.status === "paid";
  const isMuted = isPaid || entry.status === "skipped";
  const occurrenceId = entry.occurrenceId;
  const isOpen = entry.status === "pending" || entry.status === "overdue";
  const shownDate = isPaid && entry.actualDate ? entry.actualDate : entry.expectedDate;

  return (
    <li>
      <Item size="sm" className={cn("px-0 max-md:py-3", isOpen && "max-md:flex-wrap", isPending && "opacity-60")}>
        <ItemMedia className="max-md:hidden">
          <DateTile isoDate={shownDate} muted={isMuted} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className={cn(isMuted && "text-muted-foreground", isPaid && "line-through")}>
            {entry.name}
            {badge && (
              <Badge variant={badge.variant}>
                {isPaid && <Check data-icon="inline-start" />}
                {badge.label}
              </Badge>
            )}
          </ItemTitle>
          <ItemDescription>
            {!isPaid && <span className="md:hidden">{formatShortDate(shownDate)} · </span>}{SOURCE_LABEL[entry.source]}{isPaid && entry.actualDate ? ` · Pagado el ${formatShortDate(entry.actualDate)}` : ""}
            {entry.isManual && " · Marcado por ti"}
          </ItemDescription>
        </ItemContent>
        <ItemActions className={cn(isOpen && "max-md:w-full max-md:justify-between")}>
          <CurrencyText cents={isPaid && entry.actualAmountCents != null ? entry.actualAmountCents : entry.expectedAmountCents} absolute weight="semibold" tone={isMuted ? "muted" : "default"} />
          {occurrenceId != null && isOpen && (
            <Button type="button" size="sm" disabled={isPending} onClick={() => decide("mark_paid")}>
              Marcar pagado
            </Button>
          )}
          {occurrenceId != null && (isOpen || REOPEN_LABEL[entry.status]) && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label={`Más acciones de ${entry.name}`} disabled={isPending} />}>
                  <Icon icon={EllipsisVertical} />
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOpen && (
                  <>
                    <DropdownMenuItem onSelect={openPicker}>Elegir movimiento</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => decide("skip")}>Omitir</DropdownMenuItem>
                  </>
                )}
                {REOPEN_LABEL[entry.status] && <DropdownMenuItem onSelect={() => decide("reopen")}>{REOPEN_LABEL[entry.status]}</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </ItemActions>
      </Item>
      {occurrenceId != null && <OccurrencePaymentPicker occurrenceId={occurrenceId} candidates={candidates} open={pickerOpen} onOpenChange={setPickerOpen} linkAction={linkPaymentAction} />}
    </li>
  );
}
