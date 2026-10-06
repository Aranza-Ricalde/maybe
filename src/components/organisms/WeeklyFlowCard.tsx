import { Card } from "@heroui/react";
import { Text } from "@/components/atoms/Text";
import type { WeeklyFlow } from "@/domain/dashboard/weekly";
import { formatPesos, formatShortDate } from "@/lib/format";

const signed = (cents: number) => `${cents >= 0 ? "+" : "−"}${formatPesos(Math.abs(cents))}`;

export function WeeklyFlowCard({ weeks }: { weeks: WeeklyFlow[] }) {
  if (weeks.length === 0) return null;

  return (
    <Card className="p-5">
      <Card.Header>
        <Card.Title>Flujo por semana</Card.Title>
        <Card.Description>Cada semana de lunes a domingo dentro del periodo, sin transferencias entre tus cuentas.</Card.Description>
      </Card.Header>
      <Card.Content>
        <ul className="flex flex-col divide-y divide-separator">
          {weeks.map((w) => (
            <li key={w.from} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-0.5 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto_auto_auto]">
              <p className="text-sm font-medium">
                {formatShortDate(w.from)}
                {w.to !== w.from && ` – ${formatShortDate(w.to)}`}
              </p>
              <span className={`text-right text-sm font-semibold tabular-nums sm:order-last ${w.netCents < 0 ? "text-danger" : "text-success"}`}>{signed(w.netCents)}</span>
              <Text size="xs" tone="muted" className="tabular-nums sm:text-right">
                Entró {formatPesos(w.incomeCents)}
              </Text>
              <Text size="xs" tone="muted" className="tabular-nums sm:text-right">
                Salió {formatPesos(w.expenseCents)}
              </Text>
            </li>
          ))}
        </ul>
      </Card.Content>
    </Card>
  );
}
