import { Button } from "@heroui/react";
import { Chip } from "@/components/atoms/Chip";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import type { CalendarEntry } from "@/domain/calendar/rules";
import type { OccurrenceDecision } from "@/domain/recurring/occurrences";
import { formatShortDate } from "@/lib/format";
import { OccurrencePaymentPicker, type PaymentCandidateView } from "./OccurrencePaymentPicker";
import { FIELD } from "@/lib/formFields";

const STATUS_CHIP: Record<CalendarEntry["status"], { tone: "success" | "danger" | "muted"; label: string }> = {
  paid: { tone: "success", label: "Pagado" },
  overdue: { tone: "danger", label: "Atrasado" },
  pending: { tone: "muted", label: "Esperado" },
  skipped: { tone: "muted", label: "Omitido" },
};

const SOURCE_LABEL: Record<CalendarEntry["source"], string> = { recurrente: "Recurrente", programado: "Programado", deuda: "Vencimiento de deuda" };

const DECISIONS_BY_STATUS: Record<CalendarEntry["status"], { decision: OccurrenceDecision; label: string; primary?: boolean }[]> = {
  pending: [
    { decision: "mark_paid", label: "Marcar pagado", primary: true },
    { decision: "skip", label: "Omitir" },
  ],
  overdue: [
    { decision: "mark_paid", label: "Marcar pagado", primary: true },
    { decision: "skip", label: "Omitir" },
  ],
  paid: [{ decision: "reopen", label: "Deshacer" }],
  skipped: [{ decision: "reopen", label: "Restaurar" }],
};

export interface CalendarEntryListItemProps {
  entry: CalendarEntry;
  decisionAction: (formData: FormData) => void;
  listPaymentCandidates: (occurrenceId: number) => Promise<PaymentCandidateView[]>;
  linkPaymentAction: (formData: FormData) => void;
}

export function CalendarEntryListItem({ entry, decisionAction, listPaymentCandidates, linkPaymentAction }: CalendarEntryListItemProps) {
  const chip = STATUS_CHIP[entry.status];
  const isPaid = entry.status === "paid";
  const isMuted = isPaid || entry.status === "skipped";
  const decisions = entry.occurrenceId != null ? DECISIONS_BY_STATUS[entry.status] : [];
  const canPickPayment = entry.occurrenceId != null && (entry.status === "pending" || entry.status === "overdue");

  return (
    <li className="py-2.5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-sm font-medium ${isMuted ? "text-muted" : ""} ${isPaid ? "line-through" : ""}`}>{entry.name}</p>
          <Text size="xs" tone="muted">
            {SOURCE_LABEL[entry.source]} ·{" "}
            {isPaid && entry.actualDate ? `Real: ${formatShortDate(entry.actualDate)}` : `Esperado: ${formatShortDate(entry.expectedDate)}`}
            {entry.isManual && " · Marcado por ti"}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <CurrencyText
            cents={isPaid && entry.actualAmountCents != null ? entry.actualAmountCents : entry.expectedAmountCents}
            absolute
            weight="semibold"
            tone={isMuted ? "muted" : "default"}
          />
          <Chip tone={chip.tone}>{chip.label}</Chip>
        </div>
      </div>
      {decisions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap justify-end gap-1.5">
          {canPickPayment && (
            <OccurrencePaymentPicker occurrenceId={entry.occurrenceId as number} listCandidates={listPaymentCandidates} linkAction={linkPaymentAction} />
          )}
          {decisions.map((d) => (
            <form key={d.decision} action={decisionAction}>
              <input type="hidden" name={FIELD.occurrenceId} value={entry.occurrenceId as number} />
              <input type="hidden" name={FIELD.decision} value={d.decision} />
              <Button type="submit" size="sm" variant={d.primary ? "primary" : "ghost"}>
                {d.label}
              </Button>
            </form>
          ))}
        </div>
      )}
    </li>
  );
}
