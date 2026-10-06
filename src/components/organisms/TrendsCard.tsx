import { Card } from "@heroui/react";
import { Text } from "@/components/atoms/Text";
import type { TrendSummary } from "@/domain/trends/rules";
import { formatMonthYear, formatPesos, formatSignedPercent } from "@/lib/format";

const deltaClass = (cents: number) => (cents > 0 ? "text-danger" : cents < 0 ? "text-success" : "text-muted");
const signed = (cents: number) => `${cents > 0 ? "+" : cents < 0 ? "−" : ""}${formatPesos(Math.abs(cents))}`;

export function TrendsCard({ trends }: { trends: TrendSummary | null }) {
  if (!trends) return null;

  return (
    <Card className="p-5">
      <Card.Header>
        <Card.Title>¿Estás gastando más o menos que antes?</Card.Title>
        <Card.Description>
          En {formatMonthYear(trends.month)} gastaste {formatPesos(trends.lastCents)}. Así se compara:
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <ul className="flex flex-col divide-y divide-separator">
          {trends.comparisons.map((c) => (
            <li key={c.key} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium">{c.label}</p>
                <Text size="xs" tone="muted">
                  {formatPesos(c.baselineCents)}
                </Text>
              </div>
              <div className={`shrink-0 text-right text-sm font-semibold tabular-nums ${deltaClass(c.deltaCents)}`}>
                {signed(c.deltaCents)}
                {c.deltaPct != null && <span className="ml-1.5 text-xs font-normal">({formatSignedPercent(c.deltaPct)})</span>}
              </div>
            </li>
          ))}
        </ul>
      </Card.Content>
    </Card>
  );
}
