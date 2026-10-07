import { Card } from "@heroui/react";
import { Text } from "@/components/atoms/Text";
import { StatBlock } from "@/components/molecules/StatBlock";
import { StatBlockRow } from "@/components/molecules/StatBlockRow";
import { DEFAULT_PROJECTION_MONTHS, type ProjectionAssumptions, type ProjectionBase, type ProjectionResult } from "@/domain/projection/rules";
import { formatPesos } from "@/lib/format";

export interface ProjectionSummaryProps {
  base: ProjectionBase;
  result: ProjectionResult;
  hasScenario: boolean;
  assumptions: ProjectionAssumptions;
  basisMonthsLabel: string;
}

export function ProjectionSummary({ base, result, hasScenario, assumptions, basisMonthsLabel }: ProjectionSummaryProps) {
  const finalBalance = hasScenario ? result.finalScenarioCents : result.finalBaselineCents;
  const finalWealth = hasScenario ? result.finalScenarioNetWorthCents : result.finalBaselineNetWorthCents;
  const usesRecurring = assumptions.method === "recurring";

  return (
    <>
      <StatBlockRow>
        <StatBlock
          label={`Saldo en ${DEFAULT_PROJECTION_MONTHS} meses`}
          value={formatPesos(finalBalance)}
          tone={finalBalance < 0 ? "danger" : "default"}
          tooltip="Tu saldo en cuentas líquidas dentro de 12 meses si todo sigue como en los supuestos de abajo."
          hint={
            <Text size="xs" tone="muted" className="mt-1 block">
              {hasScenario ? `${result.differenceCents >= 0 ? "+" : "−"}${formatPesos(Math.abs(result.differenceCents))} frente a no cambiar nada` : `Hoy ${formatPesos(base.startBalanceCents)}`}
            </Text>
          }
        />
        <StatBlock
          label={`Patrimonio en ${DEFAULT_PROJECTION_MONTHS} meses`}
          value={formatPesos(finalWealth)}
          tone={finalWealth < 0 ? "danger" : "default"}
          tooltip="Lo que tendrás menos lo que debes dentro de 12 meses."
          hint={
            <Text size="xs" tone="muted" className="mt-1 block">
              Hoy {formatPesos(base.startNetWorthCents)}
              {hasScenario && result.finalScenarioNetWorthCents !== result.finalBaselineNetWorthCents && ` · ${result.finalScenarioNetWorthCents > result.finalBaselineNetWorthCents ? "+" : "−"}${formatPesos(Math.abs(result.finalScenarioNetWorthCents - result.finalBaselineNetWorthCents))} por tu escenario`}
            </Text>
          }
        />
        <StatBlock
          label="Ahorro mensual esperado"
          value={formatPesos(result.baselineMonthlyNetCents)}
          tone={result.baselineMonthlyNetCents < 0 ? "danger" : "default"}
          tooltip="Ingresos esperados menos gastos esperados al mes, según los supuestos."
          hint={
            <Text size="xs" tone="muted" className="mt-1 block">
              {result.runwayMonths == null ? "Sin gasto registrado" : `Tu saldo líquido alcanza para ${result.runwayMonths.toFixed(1)} meses de gasto`}
            </Text>
          }
        />
      </StatBlockRow>

      <Card className="p-5" data-testid="projection-assumptions">
        <Card.Header>
          <Card.Title>Qué supone esta proyección</Card.Title>
          <Card.Description>{basisMonthsLabel}</Card.Description>
        </Card.Header>
        <Card.Content className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-medium">Ingresos: {formatPesos(base.monthlyIncomeCents)} al mes</p>
            <Text size="xs" tone="muted" className="block">
              {usesRecurring
                ? `${formatPesos(assumptions.recurringIncomeCents)} de tus ingresos recurrentes (nómina) + ${formatPesos(assumptions.variableIncomeCents)} de ingresos variables (la mediana de los meses, para que un ingreso extraordinario no infle la base).`
                : "Promedio simple de los meses con datos. Registra tu nómina como recurrente de ingreso para una base más estable."}
            </Text>
          </div>
          <div>
            <p className="font-medium">Gastos: {formatPesos(base.monthlyExpenseCents)} al mes</p>
            <Text size="xs" tone="muted" className="block">
              {usesRecurring
                ? `${formatPesos(assumptions.recurringExpenseCents)} de gastos recurrentes + ${formatPesos(assumptions.variableExpenseCents)} de gasto variable (el promedio de los meses, sin contar dos veces lo recurrente).`
                : "Promedio simple de los meses con datos."}
            </Text>
          </div>
          <Text size="xs" tone="muted" className="block sm:col-span-2">
            Parte de tu saldo en cuentas líquidas (corriente, débito y efectivo) y suma lo que falta del mes en curso. No incluye inflación, intereses ni cambios de sueldo; los escenarios de abajo mueven estos números.
          </Text>
        </Card.Content>
      </Card>
    </>
  );
}
