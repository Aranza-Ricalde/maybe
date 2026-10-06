import type { AccountSnapshotReader, BalanceReader, DashboardRepository } from "@/domain/dashboard/ports";
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

export async function balanceSeriesForAccounts(repo: BalanceReader, accountIds: number[], bounds: RangeBounds, today: string): Promise<EvolutionPoint[]> {
  if (bounds.granularity === "daily") {
    const series = await repo.getDailyBalanceSeries(accountIds, bounds.fromDate, today);
    return series.map((p) => ({ date: p.date, value: p.balanceCents }));
  }
  const sampleDates = bounds.months.map((m) => monthSampleDate(m, today));
  const values = await repo.getBalancesAtDates(accountIds, sampleDates);
  return bounds.months.map((m, i) => ({ date: m, value: values[i] }));
}

interface SeriesRequest {
  repo: DashboardRepository;
  familyId: number;
  bounds: RangeBounds;
  today: string;
}

type SeriesBuilder = (request: SeriesRequest) => Promise<EvolutionPoint[]>;

const accountIdsOf = (accounts: Array<{ accountId: number }>) => accounts.map((account) => account.accountId);

async function allLiabilityAccountIds(repo: AccountSnapshotReader, familyId: number, today: string): Promise<number[]> {
  const [cards, otherLiabilities] = await Promise.all([repo.getCreditCardAccounts(familyId, today), repo.getOtherLiabilityAccounts(familyId, today)]);
  return accountIdsOf([...cards, ...otherLiabilities]);
}

function flowSeries(metric: "income" | "expense"): SeriesBuilder {
  const valueOf = (income: number, expense: number) => (metric === "income" ? income : Math.abs(expense));

  return async ({ repo, familyId, bounds, today }) => {
    if (bounds.granularity === "daily") {
      const rows = await repo.getDailyFlow(familyId, bounds.fromDate, today);
      return rows.map((row) => ({ date: row.date, value: valueOf(row.incomeCents, row.expenseCents) }));
    }

    const rows = await repo.getMonthlyFlowRange(familyId, bounds.months[0], bounds.months[bounds.months.length - 1]);
    const byMonth = new Map(rows.map((row) => [row.month, row]));
    return bounds.months.map((month) => ({ date: month, value: valueOf(byMonth.get(month)?.incomeCents ?? 0, byMonth.get(month)?.expenseCents ?? 0) }));
  };
}

const debtSeries: SeriesBuilder = async ({ repo, familyId, bounds, today }) => {
  const series = await balanceSeriesForAccounts(repo, await allLiabilityAccountIds(repo, familyId, today), bounds, today);
  return series.map((point) => ({ date: point.date, value: Math.abs(point.value) }));
};

const netWorthSeries: SeriesBuilder = async ({ repo, familyId, bounds, today }) => {
  const [assets, liabilityIds] = await Promise.all([repo.getAssetAccounts(familyId, today), allLiabilityAccountIds(repo, familyId, today)]);
  return balanceSeriesForAccounts(repo, [...accountIdsOf(assets), ...liabilityIds], bounds, today);
};

const balanceSeries: SeriesBuilder = async ({ repo, familyId, bounds, today }) =>
  balanceSeriesForAccounts(repo, accountIdsOf(await repo.getAssetAccounts(familyId, today)), bounds, today);

const savingsSeries: SeriesBuilder = async ({ repo, familyId, bounds, today }) => {
  const accountIds = accountIdsOf(await repo.getSavingsAccounts(familyId, today));

  if (bounds.granularity === "daily") {
    const series = await repo.getDailyBalanceSeries(accountIds, shiftDays(bounds.fromDate, -1), today);
    return levelsToDeltas(series.map((point) => ({ date: point.date, value: point.balanceCents })));
  }

  const sampleDates = [endOfMonth(shiftMonth(bounds.months[0], -1)), ...bounds.months.map((month) => monthSampleDate(month, today))];
  const values = await repo.getBalancesAtDates(accountIds, sampleDates);
  const deltas = levelsToDeltas(sampleDates.map((date, index) => ({ date, value: values[index] })));
  return bounds.months.map((month, index) => ({ date: month, value: deltas[index].value }));
};

const SERIES_BUILDERS: Record<EvolutionMetric, SeriesBuilder> = {
  balance: balanceSeries,
  savings: savingsSeries,
  netWorth: netWorthSeries,
  debt: debtSeries,
  income: flowSeries("income"),
  expense: flowSeries("expense"),
};

export class GetFinancialEvolutionUseCase {
  constructor(private readonly repo: DashboardRepository) {}

  async execute(familyId: number, metric: EvolutionMetric, range: EvolutionRangeKey, today: string): Promise<EvolutionPoint[]> {
    return SERIES_BUILDERS[metric]({ repo: this.repo, familyId, bounds: rangeBounds(range, today), today });
  }
}
