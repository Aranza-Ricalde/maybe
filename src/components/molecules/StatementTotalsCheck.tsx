import { CircleCheck } from "lucide-react";
import { Text } from "@/components/atoms/Text";
import type { StatementCheck } from "@/domain/statements/types";
import { formatCurrency } from "@/lib/format";

const show = (check: StatementCheck, value: number) => (check.isMoney ? formatCurrency(value) : String(value));

export function StatementTotalsCheck({ checks }: { checks: StatementCheck[] }) {
  const failing = checks.filter((check) => check.expected !== check.actual);
  if (failing.length === 0) {
    return (
      <details className="group rounded-lg bg-success/10 px-3 py-1.5">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium text-success">
          <CircleCheck className="size-3.5" aria-hidden />
          Totales verificados con el PDF
        </summary>
        <ul className="mt-2 flex flex-col gap-1">
          {checks.map((check) => (
            <li key={check.label}>
              <Text size="xs" tone="muted">
                {check.label}: {show(check, check.expected)}
              </Text>
            </li>
          ))}
        </ul>
      </details>
    );
  }
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-danger/10 px-3 py-2">
      <Text size="sm" weight="medium" tone="danger">
        Los totales no cuadran con el PDF
      </Text>
      {failing.map((check) => (
        <Text key={check.label} size="xs">
          {check.label}: el PDF dice {show(check, check.expected)}, leímos {show(check, check.actual)}
          {check.isMoney ? ` (diferencia ${formatCurrency(check.actual - check.expected)})` : ""}
        </Text>
      ))}
    </div>
  );
}
