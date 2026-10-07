import type { DashboardSummary } from "@/application/getDashboardSummary";
import { Text } from "@/components/atoms/Text";
import { StatBlock } from "@/components/molecules/StatBlock";
import { StatBlockRow } from "@/components/molecules/StatBlockRow";
import { formatCurrency, formatPercent, formatPesos } from "@/lib/format";
import { DebtDetailModal, type DebtAccountInput } from "./DebtDetailModal";
import { SavingsGoalsModal, type SavingsGoalInput } from "./SavingsGoalsModal";

export interface DashboardKpiRowProps {
  totalBalanceCents: number;
  debtTotalCents: number;
  debtPaidThisPeriodCents: number;
  debtOverallPercentPaid: number;
  debtAccounts: DebtAccountInput[];
  savingsTotalCents: number;
  goals: SavingsGoalInput[];
  wealth: DashboardSummary["wealth"];
  savingsRate: DashboardSummary["savingsRate"];
}

export function DashboardKpiRow({ totalBalanceCents, debtTotalCents, debtPaidThisPeriodCents, debtOverallPercentPaid, debtAccounts, savingsTotalCents, goals, wealth, savingsRate }: DashboardKpiRowProps) {
  const { change } = wealth;

  return (
    <StatBlockRow>
      <StatBlock label="Saldo total" value={formatCurrency(totalBalanceCents)} tooltip="Suma de todas tus cuentas de activos, sin restar deudas." />
      <StatBlock
        label="Deuda total"
        value={formatCurrency(Math.abs(debtTotalCents))}
        tone="danger"
        tooltip="Lo que debes en tarjetas de crédito y préstamos."
        hint={
          <div className="mt-1 flex items-center gap-2">
            {debtPaidThisPeriodCents > 0 && (
              <Text size="xs" tone="success">
                −{formatCurrency(debtPaidThisPeriodCents)} este periodo
              </Text>
            )}
            <DebtDetailModal totalCents={debtTotalCents} paidThisPeriodCents={debtPaidThisPeriodCents} overallPercentPaid={debtOverallPercentPaid} accounts={debtAccounts} />
          </div>
        }
      />
      <StatBlock
        label="Ahorros"
        value={formatCurrency(savingsTotalCents)}
        tooltip="Suma de tus cuentas de ahorro."
        hint={
          <div className="mt-1 flex flex-col gap-0.5">
            {savingsRate.rate != null && (
              <Text size="xs" tone="muted">
                {savingsRate.savedCents >= 0 ? "Ahorraste" : "Retiraste"} {formatPesos(Math.abs(savingsRate.savedCents))} ({formatPercent(savingsRate.rate)} de tus ingresos) este periodo
              </Text>
            )}
            <SavingsGoalsModal savingsTotalCents={savingsTotalCents} goals={goals} />
          </div>
        }
      />
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
    </StatBlockRow>
  );
}
