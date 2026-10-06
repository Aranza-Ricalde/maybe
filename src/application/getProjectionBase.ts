import type { AccountSnapshotReader, FlowReader } from "@/domain/dashboard/ports";
import { shiftMonth } from "@/domain/dashboard/rules";
import { monthStart } from "@/domain/ledger/rules";
import type { ProjectionBase } from "@/domain/projection/rules";
import type { CategoryStatsReader } from "@/domain/categoryStats/ports";

const AVERAGE_MONTHS = 3;

export interface ProjectionBaseView extends ProjectionBase {
  basisMonths: string[];
}

const average = (values: number[]) => (values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0);

export class GetProjectionBaseUseCase {
  constructor(
    private readonly dashboardRepo: AccountSnapshotReader & FlowReader,
    private readonly categoryStats: CategoryStatsReader,
  ) {}

  async execute(familyId: number, today: string): Promise<ProjectionBaseView> {
    const currentMonth = monthStart(today);
    const [liquidAccounts, assets, cards, otherLiabilities, flow, stats] = await Promise.all([
      this.dashboardRepo.getLiquidAccounts(familyId, today),
      this.dashboardRepo.getAssetAccounts(familyId, today),
      this.dashboardRepo.getCreditCardAccounts(familyId, today),
      this.dashboardRepo.getOtherLiabilityAccounts(familyId, today),
      this.dashboardRepo.getMonthlyFlowRange(familyId, shiftMonth(currentMonth, -AVERAGE_MONTHS), shiftMonth(currentMonth, -1)),
      this.categoryStats.execute(familyId, today),
    ]);

    const monthsWithData = flow.filter((f) => f.incomeCents !== 0 || f.expenseCents !== 0);
    return {
      currentMonth,
      startBalanceCents: liquidAccounts.reduce((sum, a) => sum + a.balanceCents, 0),
      startNetWorthCents: [...assets, ...cards, ...otherLiabilities].reduce((sum, a) => sum + a.balanceCents, 0),
      monthlyIncomeCents: average(monthsWithData.map((f) => Math.abs(f.incomeCents))),
      monthlyExpenseCents: average(monthsWithData.map((f) => Math.abs(f.expenseCents))),
      categories: stats.rows
        .filter((r) => r.depth === 0 && r.categoryId > 0 && r.avgLast3Cents > 0)
        .map((r) => ({ id: r.categoryId, name: r.name, avgMonthlyCents: r.avgLast3Cents, discretionaryShare: r.discretionaryShare })),
      basisMonths: monthsWithData.map((f) => f.month),
    };
  }
}
