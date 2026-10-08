import type { FormAction } from "@/lib/actionResult";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarEntryListItem } from "@/components/molecules/CalendarEntryListItem";
import { EyebrowLabel } from "@/components/atoms/EyebrowLabel";
import type { PaymentCandidateView } from "@/components/molecules/OccurrencePaymentPicker";
import { groupCalendarEntriesByStatus, type CalendarEntry } from "@/domain/calendar/rules";

export interface FinancialCalendarCardProps {
  entries: CalendarEntry[];
  decisionAction: FormAction;
  listPaymentCandidates: (occurrenceId: number) => Promise<PaymentCandidateView[]>;
  linkPaymentAction: FormAction;
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
    <Card>
      <CardHeader>
        <CardTitle>Calendario del periodo</CardTitle>
        <CardDescription>Esperado vs. real de este periodo.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {sections.map((section) => (
          <div key={section.label}>
            <EyebrowLabel>{section.label}</EyebrowLabel>
            <ul className="mt-1 flex flex-col divide-y divide-border">
              {section.items.map((e) => (
                <CalendarEntryListItem key={entryKey(e)} entry={e} decisionAction={decisionAction} listPaymentCandidates={listPaymentCandidates} linkPaymentAction={linkPaymentAction} />
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
