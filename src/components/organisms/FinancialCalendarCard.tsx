import { Card } from "@heroui/react";
import { CalendarEntryListItem } from "@/components/molecules/CalendarEntryListItem";
import { EyebrowLabel } from "@/components/atoms/EyebrowLabel";
import type { PaymentCandidateView } from "@/components/molecules/OccurrencePaymentPicker";
import { groupCalendarEntriesByStatus, type CalendarEntry } from "@/domain/calendar/rules";

export interface FinancialCalendarCardProps {
  entries: CalendarEntry[];
  decisionAction: (formData: FormData) => void;
  listPaymentCandidates: (occurrenceId: number) => Promise<PaymentCandidateView[]>;
  linkPaymentAction: (formData: FormData) => void;
}

const entryKey = (e: CalendarEntry) => (e.occurrenceId != null ? `occ-${e.occurrenceId}` : `${e.source}-${e.name}-${e.expectedDate}`);

export function FinancialCalendarCard({ entries, decisionAction, listPaymentCandidates, linkPaymentAction }: FinancialCalendarCardProps) {
  if (entries.length === 0) return null;
  const { pending, paid, skipped } = groupCalendarEntriesByStatus(entries);

  const sections = [
    { label: "Por pagar", items: pending },
    { label: "Ya pagado", items: paid },
    { label: "Omitido", items: skipped },
  ].filter((s) => s.items.length > 0);

  return (
    <Card className="p-5">
      <Card.Header>
        <Card.Title>Calendario del periodo</Card.Title>
        <Card.Description>Esperado vs. real de este periodo.</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        {sections.map((section) => (
          <div key={section.label}>
            <EyebrowLabel>{section.label}</EyebrowLabel>
            <ul className="mt-1 flex flex-col divide-y divide-separator">
              {section.items.map((e) => (
                <CalendarEntryListItem key={entryKey(e)} entry={e} decisionAction={decisionAction} listPaymentCandidates={listPaymentCandidates} linkPaymentAction={linkPaymentAction} />
              ))}
            </ul>
          </div>
        ))}
      </Card.Content>
    </Card>
  );
}
