import { Card } from "@heroui/react";
import { Text } from "@/components/atoms/Text";
import { FinancialStatusBanner } from "./FinancialStatusBanner";
import { FlowWaterfallChart } from "./FlowWaterfallChart";
import { categoryBreakdown, type CategoryTreeInput } from "@/domain/categories/rules";
import { GastosBreakdownModal, type GastosBreakdownItem } from "./GastosBreakdownModal";
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
  categories: CategoryTreeInput[];
}

const MAX_PRINCIPAL_CATEGORIES_SHOWN = 6;

function buildGastosBreakdown(categoryActuals: CategoryActual[], categories: CategoryTreeInput[]): GastosBreakdownItem[] {
  const rows = categoryBreakdown(categoryActuals, categories).map((r) => ({ name: r.name, spentCents: Math.abs(r.totalCents), depth: r.depth }));
  const shown: GastosBreakdownItem[] = [];
  let principals = 0;
  for (const row of rows) {
    if (row.depth === 0) principals++;
    if (principals > MAX_PRINCIPAL_CATEGORIES_SHOWN) break;
    shown.push(row);
  }
  return shown;
}

export function PeriodFlowCard({ status, flow, balanceSeries, categoryActuals, categories }: PeriodFlowCardProps) {
  const gastosBreakdown = buildGastosBreakdown(categoryActuals, categories);
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
