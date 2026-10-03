import type { DashboardRepository } from "@/domain/dashboard/ports";
import { shiftMonth } from "@/domain/dashboard/rules";
import { endOfMonth } from "@/domain/cashflow/rules";
import {
  type EvolutionMetric,
  type EvolutionPoint,
  type EvolutionRangeKey,
  type RangeBounds,
  levelsToDeltas,
  monthSampleDate,
  rangeBounds,
  shiftDays,
} from "@/domain/evolution/rules";

export async function balanceSeriesForAccounts(
  repo: DashboardRepository,
  accountIds: number[],
  bounds: RangeBounds,
  today: string,
): Promise<EvolutionPoint[]> {
  if (bounds.granularity === "daily") {
    const series = await repo.getDailyBalanceSeries(accountIds, bounds.fromDate, today);
    return series.map((p) => ({ date: p.date, value: p.balanceCents }));
  }
  const sampleDates = bounds.months.map((m) => monthSampleDate(m, today));
  const values = await Promise.all(sampleDates.map((d) => repo.getBalanceAt(accountIds, d)));
  return bounds.months.map((m, i) => ({ date: m, value: values[i] }));
}

export class GetFinancialEvolutionUseCase {
  constructor(private readonly repo: DashboardRepository) {}

  async execute(familyId: number, metric: EvolutionMetric, range: EvolutionRangeKey, today: string): Promise<EvolutionPoint[]> {
    const bounds = rangeBounds(range, today);

    if (metric === "income" || metric === "expense") {
      return this.flowSeries(familyId, metric, bounds, today);
    }
    return this.balanceSeries(familyId, metric, bounds, today);
  }

  private async flowSeries(
    familyId: number,
    metric: "income" | "expense",
    bounds: ReturnType<typeof rangeBounds>,
    today: string,
  ): Promise<EvolutionPoint[]> {
    if (bounds.granularity === "daily") {
      const rows = await this.repo.getDailyFlow(familyId, bounds.fromDate, today);
      return rows.map((r) => ({ date: r.date, value: metric === "income" ? r.incomeCents : Math.abs(r.expenseCents) }));
    }

    const lastMonth = bounds.months[bounds.months.length - 1];
    const rows = await this.repo.getMonthlyFlowRange(familyId, bounds.months[0], lastMonth);
    const byMonth = new Map(rows.map((r) => [r.month, r]));
    return bounds.months.map((m) => {
      const row = byMonth.get(m);
      const value = metric === "income" ? (row?.incomeCents ?? 0) : Math.abs(row?.expenseCents ?? 0);
      return { date: m, value };
    });
  }

  private async balanceSeries(
    familyId: number,
    metric: "balance" | "savings",
    bounds: ReturnType<typeof rangeBounds>,
    today: string,
  ): Promise<EvolutionPoint[]> {
    const accounts = metric === "savings" ? await this.repo.getSavingsAccounts(familyId, today) : await this.repo.getAssetAccounts(familyId, today);
    const accountIds = accounts.map((a) => a.accountId);

    if (metric === "balance") {
      return balanceSeriesForAccounts(this.repo, accountIds, bounds, today);
    }

    if (bounds.granularity === "daily") {
      const series = await this.repo.getDailyBalanceSeries(accountIds, shiftDays(bounds.fromDate, -1), today);
      return levelsToDeltas(series.map((p) => ({ date: p.date, value: p.balanceCents })));
    }

    const previousMonth = shiftMonth(bounds.months[0], -1);
    const sampleDates = [endOfMonth(previousMonth), ...bounds.months.map((m) => monthSampleDate(m, today))];
    const values = await Promise.all(sampleDates.map((d) => this.repo.getBalanceAt(accountIds, d)));
    const levels = sampleDates.map((d, i) => ({ date: d, value: values[i] }));
    const deltas = levelsToDeltas(levels);
    return bounds.months.map((m, i) => ({ date: m, value: deltas[i].value }));
  }
}
