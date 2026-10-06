import { Card } from "@heroui/react";
import { DEFAULT_PROJECTION_MONTHS, type ProjectionBase, type ProjectionResult } from "@/domain/projection/rules";
import { formatPesos } from "@/lib/format";

export function ProjectionSummaryCards({ base, result, hasScenario }: { base: ProjectionBase; result: ProjectionResult; hasScenario: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="min-w-0 p-5">
        <p className="text-xs font-medium text-muted uppercase">Saldo líquido hoy</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{formatPesos(base.startBalanceCents)}</p>
        <p className="mt-1 text-xs text-muted">
          {result.runwayMonths == null ? "Sin gasto registrado" : `Alcanza para ${result.runwayMonths.toFixed(1)} meses al ritmo de gasto actual`}
        </p>
      </Card>
      <Card className="min-w-0 p-5">
        <p className="text-xs font-medium text-muted uppercase">Ahorro mensual promedio</p>
        <p className={`mt-1 text-2xl font-semibold tabular-nums ${result.baselineMonthlyNetCents < 0 ? "text-danger" : ""}`}>{formatPesos(result.baselineMonthlyNetCents)}</p>
        <p className="mt-1 text-xs text-muted">
          Ingresos {formatPesos(base.monthlyIncomeCents)} − gastos {formatPesos(base.monthlyExpenseCents)}
        </p>
      </Card>
      <Card className="min-w-0 p-5">
        <p className="text-xs font-medium text-muted uppercase">Saldo en {DEFAULT_PROJECTION_MONTHS} meses</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{formatPesos(hasScenario ? result.finalScenarioCents : result.finalBaselineCents)}</p>
        <p className="mt-1 text-xs text-muted">
          {hasScenario
            ? `${result.differenceCents >= 0 ? "+" : "−"}${formatPesos(Math.abs(result.differenceCents))} frente a no cambiar nada`
            : "Si todo sigue como hasta ahora"}
        </p>
      </Card>
      <Card className="min-w-0 p-5">
        <p className="text-xs font-medium text-muted uppercase">Patrimonio en {DEFAULT_PROJECTION_MONTHS} meses</p>
        <p className={`mt-1 text-2xl font-semibold tabular-nums ${(hasScenario ? result.finalScenarioNetWorthCents : result.finalBaselineNetWorthCents) < 0 ? "text-danger" : ""}`}>
          {formatPesos(hasScenario ? result.finalScenarioNetWorthCents : result.finalBaselineNetWorthCents)}
        </p>
        <p className="mt-1 text-xs text-muted">
          Hoy {formatPesos(base.startNetWorthCents)}
          {hasScenario && result.finalScenarioNetWorthCents !== result.finalBaselineNetWorthCents && ` · ${result.finalScenarioNetWorthCents > result.finalBaselineNetWorthCents ? "+" : "−"}${formatPesos(Math.abs(result.finalScenarioNetWorthCents - result.finalBaselineNetWorthCents))} por tu escenario`}
        </p>
      </Card>
    </div>
  );
}
