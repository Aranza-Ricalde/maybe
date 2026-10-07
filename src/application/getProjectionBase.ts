import type { AccountSnapshotReader, FlowReader } from "@/domain/dashboard/ports";
import { shiftMonth } from "@/domain/dashboard/rules";
import { monthStart } from "@/domain/ledger/rules";
import type { CashflowRepository } from "@/domain/cashflow/ports";
import { deriveMonthlyBase, remainingMonthFraction, type ProjectionAssumptions, type ProjectionBase } from "@/domain/projection/rules";
import type { CategoryStatsReader } from "@/domain/categoryStats/ports";

const AVERAGE_MONTHS = 3;

export interface ProjectionBaseView extends ProjectionBase {
  basisMonths: string[];
  assumptions: ProjectionAssumptions;
}

export class GetProjectionBaseUseCase {
  constructor(
    private readonly dashboardRepo: AccountSnapshotReader & FlowReader,
    private readonly categoryStats: CategoryStatsReader,
    private readonly cashflow: Pick<CashflowRepository, "getActiveRecurringItems">,
  ) {}

  async execute(familyId: number, today: string): Promise<ProjectionBaseView> {
    const currentMonth = monthStart(today);
    const [liquidAccounts, assets, cards, otherLiabilities, flow, stats, recurring] = await Promise.all([
      this.dashboardRepo.getLiquidAccounts(familyId, today),
      this.dashboardRepo.getAssetAccounts(familyId, today),
      this.dashboardRepo.getCreditCardAccounts(familyId, today),
      this.dashboardRepo.getOtherLiabilityAccounts(familyId, today),
      this.dashboardRepo.getMonthlyFlowRange(familyId, shiftMonth(currentMonth, -AVERAGE_MONTHS), shiftMonth(currentMonth, -1)),
      this.categoryStats.execute(familyId, today),
      this.cashflow.getActiveRecurringItems(familyId),
    ]);

    const monthsWithData = flow.filter((f) => f.incomeCents !== 0 || f.expenseCents !== 0);
    const recurringIncomeCents = recurring.filter((item) => item.estimatedAmountCents > 0).reduce((sum, item) => sum + item.estimatedAmountCents, 0);
    const recurringExpenseCents = recurring.filter((item) => item.estimatedAmountCents < 0).reduce((sum, item) => sum + item.estimatedAmountCents, 0);
    const derived = deriveMonthlyBase(monthsWithData, recurringIncomeCents, recurringExpenseCents);
    return {
      currentMonth,
      currentMonthRemainingFraction: remainingMonthFraction(today),
      assumptions: derived.assumptions,
      startBalanceCents: liquidAccounts.reduce((sum, a) => sum + a.balanceCents, 0),
      startNetWorthCents: [...assets, ...cards, ...otherLiabilities].reduce((sum, a) => sum + a.balanceCents, 0),
      monthlyIncomeCents: derived.incomeCents,
      monthlyExpenseCents: derived.expenseCents,
      categories: stats.rows
        .filter((r) => r.depth === 0 && r.categoryId > 0 && r.avgLast3Cents > 0)
        .map((r) => ({ id: r.categoryId, name: r.name, avgMonthlyCents: r.avgLast3Cents, discretionaryShare: r.discretionaryShare })),
      basisMonths: monthsWithData.map((f) => f.month),
    };
  }
}
