import { Text } from "@/components/atoms/Text";
import { StatBlock } from "@/components/molecules/StatBlock";
import { StatBlockRow } from "@/components/molecules/StatBlockRow";
import type { DashboardSummary } from "@/application/getDashboardSummary";
import type { EmergencyFundView } from "@/application/getEmergencyFund";
import { formatCurrency, formatPercent, formatPesos } from "@/lib/format";

export interface WealthSummaryRowProps {
  wealth: DashboardSummary["wealth"];
  savingsRate: DashboardSummary["savingsRate"];
  emergencyFund: EmergencyFundView;
}

export function WealthSummaryRow({ wealth, savingsRate, emergencyFund }: WealthSummaryRowProps) {
  const { change } = wealth;
  const target = emergencyFund.targetMonths;

  return (
    <StatBlockRow>
      <StatBlock
        label="Patrimonio neto"
        value={formatCurrency(wealth.netWorthCents)}
        tone={wealth.netWorthCents < 0 ? "danger" : "default"}
        tooltip="Lo que tienes (cuentas y ahorros) menos lo que debes (tarjetas y préstamos). Puede ser negativo."
        hint={
          <div className="mt-1 flex flex-col gap-0.5">
            <Text size="xs" tone={change.trend === "up" ? "success" : change.trend === "down" ? "danger" : "muted"}>
              {change.trend === "flat" ? "Sin cambio frente al periodo anterior" : `${change.trend === "up" ? "▲ +" : "▼ −"}${formatCurrency(Math.abs(change.deltaCents))} frente al periodo anterior`}
            </Text>
            <Text size="xs" tone="muted">
              Tienes {formatPesos(wealth.assetsCents)} y debes {formatPesos(Math.abs(wealth.liabilitiesCents))}
            </Text>
          </div>
        }
      />
      <StatBlock
        label="Tasa de ahorro"
        value={savingsRate.rate == null ? "—" : formatPercent(savingsRate.rate)}
        tooltip="Qué parte de tus ingresos del periodo pasó a tus cuentas de ahorro."
        hint={
          <div className="mt-1 flex flex-col gap-0.5">
            {savingsRate.rate == null ? (
              <Text size="xs" tone="muted">
                Sin ingresos en este periodo
              </Text>
            ) : (
              <Text size="xs" tone="muted">
                {savingsRate.savedCents >= 0 ? "Ahorraste" : "Retiraste"} {formatPesos(Math.abs(savingsRate.savedCents))} de {formatPesos(savingsRate.incomeCents)} de ingresos
              </Text>
            )}
            {savingsRate.previousRate != null && (
              <Text size="xs" tone="muted">
                Periodo anterior: {formatPercent(savingsRate.previousRate)}
              </Text>
            )}
          </div>
        }
      />
      <StatBlock
        label="Fondo de emergencia"
        value={emergencyFund.coverageMonths == null ? "—" : `${emergencyFund.coverageMonths.toFixed(1)} meses`}
        tooltip={
          emergencyFund.source === "goal"
            ? "Las cuentas de tu meta de fondo de emergencia entre tu gasto esencial mensual (las categorías que marcaste como esenciales)."
            : "Tus cuentas de ahorro entre tu gasto esencial mensual (las categorías que marcaste como esenciales)."
        }
        hint={
          <div className="mt-1 flex flex-col gap-0.5">
            {emergencyFund.coverageMonths == null ? (
              <Text size="xs" tone="muted">
                Marca tus categorías esenciales en Configuración para calcularlo
              </Text>
            ) : (
              <>
                <Text size="xs" tone={emergencyFund.missingCents === 0 ? "success" : "muted"}>
                  {emergencyFund.source === "goal" ? "Tu meta" : "Meta sugerida"}: {Number.isInteger(target) ? target : target.toFixed(1)} meses · {emergencyFund.missingCents === 0 ? "meta cumplida" : `faltan ${formatPesos(emergencyFund.missingCents as number)}`}
                </Text>
                <Text size="xs" tone="muted">
                  {formatPesos(emergencyFund.fundCents)} ahorrados · {formatPesos(emergencyFund.essentialMonthlyCents as number)} de gasto esencial al mes
                </Text>
              </>
            )}
          </div>
        }
      />
    </StatBlockRow>
  );
}
