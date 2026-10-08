import type { CashflowRepository } from "@/domain/cashflow/ports";
import { type CashflowProjection, computeCashflowProjection, endOfMonth } from "@/domain/cashflow/rules";
import { monthStart } from "@/domain/ledger/rules";

const MONTHS_FOR_AVERAGE = 3;

export class ProjectCashflowUseCase {
  constructor(
    private readonly repo: CashflowRepository,
    private readonly listPeriodStarts: (familyId: number) => Promise<string[]> = async () => [],
  ) {}

  async execute(familyId: number, accountIds: number[], asOfDate: string): Promise<CashflowProjection> {
    const [currentBalanceCents, activeRecurringItems, plannedScheduled, recentMonthlyExpenseCents, periodStarts] = await Promise.all([
      this.repo.getCurrentBalanceCents(accountIds, asOfDate),
      this.repo.getActiveRecurringItems(familyId),
      this.repo.getPlannedScheduled(familyId, asOfDate, endOfMonth(asOfDate)),
      this.repo.getRecentMonthlyExpenseCents(familyId, monthStart(asOfDate), MONTHS_FOR_AVERAGE),
      this.listPeriodStarts(familyId),
    ]);

    return computeCashflowProjection({
      asOfDate,
      currentBalanceCents,
      activeRecurringItems,
      plannedScheduled,
      recentMonthlyExpenseCents,
      periodStartsRemaining: periodStarts.filter((start) => start > asOfDate && start <= endOfMonth(asOfDate)),
    });
  }
}
