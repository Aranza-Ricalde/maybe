import { Text } from "@/components/atoms/Text";
import { formatShortDate } from "@/lib/format";

export function PaydayList({ dates }: { dates: string[] }) {
  if (dates.length === 0) {
    return (
      <Text size="sm" tone="muted">
        Indica los días de cobro para ver tus próximas fechas.
      </Text>
    );
  }

  return (
    <Text size="sm">
      <span className="text-muted-foreground">Próximos cobros: </span>
      {dates.map(formatShortDate).join(" · ")}
    </Text>
  );
}
