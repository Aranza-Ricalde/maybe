import { Card } from "@heroui/react";
import { CalendarEntryListItem } from "@/components/molecules/CalendarEntryListItem";
import { EyebrowLabel } from "@/components/atoms/EyebrowLabel";
import { groupCalendarEntriesByStatus, type CalendarEntry } from "@/domain/calendar/rules";

export function FinancialCalendarCard({ entries }: { entries: CalendarEntry[] }) {
  if (entries.length === 0) return null;
  const { pending, paid } = groupCalendarEntriesByStatus(entries);

  return (
    <Card className="p-5">
      <Card.Header>
        <Card.Title>Calendario del periodo</Card.Title>
        <Card.Description>Esperado vs. real de este periodo.</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        {pending.length > 0 && (
          <div>
            <EyebrowLabel>Por pagar</EyebrowLabel>
            <ul className="mt-1 flex flex-col divide-y divide-separator">
              {pending.map((e) => (
                <CalendarEntryListItem key={`${e.source}-${e.name}-${e.expectedDate}`} entry={e} />
              ))}
            </ul>
          </div>
        )}
        {paid.length > 0 && (
          <div>
            <EyebrowLabel>Ya pagado</EyebrowLabel>
            <ul className="mt-1 flex flex-col divide-y divide-separator">
              {paid.map((e) => (
                <CalendarEntryListItem key={`${e.source}-${e.name}-${e.expectedDate}`} entry={e} />
              ))}
            </ul>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
