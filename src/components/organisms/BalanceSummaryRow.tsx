import { Card } from "@heroui/react";
import { Text } from "@/components/atoms/Text";
import { StatBlock } from "@/components/molecules/StatBlock";
import { DebtDetailModal, type DebtAccountInput } from "./DebtDetailModal";
import { SavingsGoalsModal, type SavingsGoalInput } from "./SavingsGoalsModal";
import { formatCurrency } from "@/lib/format";

export interface BalanceSummaryRowProps {
  totalBalanceCents: number;
  debtTotalCents: number;
  debtPaidThisPeriodCents: number;
  debtOverallPercentPaid: number;
  debtAccounts: DebtAccountInput[];
  savingsTotalCents: number;
  goals: SavingsGoalInput[];
}

export function BalanceSummaryRow({
  totalBalanceCents,
  debtTotalCents,
  debtPaidThisPeriodCents,
  debtOverallPercentPaid,
  debtAccounts,
  savingsTotalCents,
  goals,
}: BalanceSummaryRowProps) {
  return (
    <Card className="p-5">
      <div className="grid grid-cols-1 divide-y divide-separator sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="sm:pr-5">
          <StatBlock label="Saldo total" value={formatCurrency(totalBalanceCents)} tooltip="Suma de todas tus cuentas de activos, sin restar deudas." />
        </div>
        <div className="pt-4 sm:px-5 sm:pt-0">
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
                <DebtDetailModal
                  totalCents={debtTotalCents}
                  paidThisPeriodCents={debtPaidThisPeriodCents}
                  overallPercentPaid={debtOverallPercentPaid}
                  accounts={debtAccounts}
                />
              </div>
            }
          />
        </div>
        <div className="pt-4 sm:pt-0 sm:pl-5">
          <StatBlock
            label="Ahorros"
            value={formatCurrency(savingsTotalCents)}
            tooltip="Suma de tus cuentas de ahorro."
            hint={
              <div className="mt-1">
                <SavingsGoalsModal savingsTotalCents={savingsTotalCents} goals={goals} />
              </div>
            }
          />
        </div>
      </div>
    </Card>
  );
}
