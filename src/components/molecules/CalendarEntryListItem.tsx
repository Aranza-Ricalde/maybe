import { Chip } from "@/components/atoms/Chip";
import { CurrencyText } from "@/components/atoms/CurrencyText";
import { Text } from "@/components/atoms/Text";
import type { CalendarEntry } from "@/domain/calendar/rules";
import { formatShortDate } from "@/lib/format";

const STATUS_CHIP: Record<CalendarEntry["status"], { tone: "success" | "danger" | "muted"; label: string }> = {
  paid: { tone: "success", label: "Pagado" },
  overdue: { tone: "danger", label: "Atrasado" },
  pending: { tone: "muted", label: "Esperado" },
};

export function CalendarEntryListItem({ entry }: { entry: CalendarEntry }) {
  const chip = STATUS_CHIP[entry.status];
  const isPaid = entry.status === "paid";

  return (
    <li className="flex items-center justify-between py-2.5">
      <div>
        <p className={`text-sm font-medium ${isPaid ? "text-muted line-through" : ""}`}>{entry.name}</p>
        <Text size="xs" tone="muted">
          {entry.source === "recurrente" ? "Recurrente" : "Programado"} ·{" "}
          {isPaid && entry.actualDate ? `Real: ${formatShortDate(entry.actualDate)}` : `Esperado: ${formatShortDate(entry.expectedDate)}`}
        </Text>
      </div>
      <div className="text-right">
        <CurrencyText
          cents={isPaid && entry.actualAmountCents != null ? entry.actualAmountCents : entry.expectedAmountCents}
          absolute
          weight="semibold"
          tone={isPaid ? "muted" : "default"}
        />
        <Chip tone={chip.tone}>{chip.label}</Chip>
      </div>
    </li>
  );
}
