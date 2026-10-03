import { Card } from "@heroui/react";
import { Text } from "@/components/atoms/Text";
import { FinancialStatusBanner } from "./FinancialStatusBanner";
import { FlowWaterfallChart } from "./FlowWaterfallChart";
import { GastosBreakdownModal } from "./GastosBreakdownModal";
import { LineEvolutionChart } from "./LineEvolutionChart";
import type { DailyBalancePoint } from "@/domain/dashboard/ports";
import type { FinancialStatusResult } from "@/domain/dashboard/rules";

interface CategoryActual {
  categoryId: number;
  totalCents: number;
}

export interface PeriodFlowCardProps {
  status: FinancialStatusResult;
  flow: { incomeCents: number; expenseCents: number; savingsCents: number; debtPaymentCents: number; remainingCents: number };
  balanceSeries: DailyBalancePoint[];
  categoryActuals: CategoryActual[];
  categoryNameById: Map<number, string>;
}

function buildGastosBreakdown(categoryActuals: CategoryActual[], categoryNameById: Map<number, string>) {
  return categoryActuals
    .map((a) => ({ name: categoryNameById.get(a.categoryId) ?? "Otro", spentCents: Math.abs(a.totalCents) }))
    .filter((c) => c.spentCents > 0)
    .sort((a, b) => b.spentCents - a.spentCents)
    .slice(0, 6);
}

export function PeriodFlowCard({ status, flow, balanceSeries, categoryActuals, categoryNameById }: PeriodFlowCardProps) {
  const gastosBreakdown = buildGastosBreakdown(categoryActuals, categoryNameById);
  const totalExpenseCents = Math.abs(flow.expenseCents);

  return (
    <Card className="p-5">
      <Card.Header>
        <Card.Title>Flujo del periodo</Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="mb-4">
          <FinancialStatusBanner status={status} />
        </div>
        <FlowWaterfallChart
          incomeCents={flow.incomeCents}
          expenseCents={flow.expenseCents}
          savingsCents={flow.savingsCents}
          debtPaymentCents={flow.debtPaymentCents}
          remainingCents={flow.remainingCents}
        />
        <div className="mt-2">
          <GastosBreakdownModal breakdown={gastosBreakdown} totalExpenseCents={totalExpenseCents} />
        </div>
        <div className="mt-5 border-t border-separator pt-4">
          <Text size="xs" tone="muted" className="mb-2">
            Saldo total durante el periodo
          </Text>
          <LineEvolutionChart
            series={balanceSeries.map((p) => ({ date: p.date, value: p.balanceCents }))}
            dateGranularity="daily"
            emptyMessage="Todavía no hay suficientes días este mes para graficar la evolución."
            tableCaption="Saldo total por día"
          />
        </div>
      </Card.Content>
    </Card>
  );
}
