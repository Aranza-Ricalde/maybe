import type { CashflowRepository } from "@/domain/cashflow/ports";
import {
  DEFAULT_PROJECTION_DAYS,
  cashProjectionStatus,
  projectDailyBalance,
  recurringEvents,
  variableDailyRateCents,
  type CashEvent,
  type DailyProjection,
} from "@/domain/cashflow/daily";
import type { AccountSnapshotReader } from "@/domain/dashboard/ports";
import type { FinancialStatusResult } from "@/domain/dashboard/rules";
import { monthStart } from "@/domain/ledger/rules";
import { addDays } from "@/domain/payPeriod/rules";
import type { RecurringOccurrencesRepository } from "@/domain/recurring/ports";
import type { FamilySettingsRepository } from "@/domain/settings/ports";
import { effectiveMinimumBalance } from "@/domain/settings/rules";

const MONTHS_FOR_AVERAGE = 3;
const OVERDUE_LOOKBACK_DAYS = 31;

export interface CashProjectionView {
  projection: DailyProjection;
  status: FinancialStatusResult;
  days: number;
  minimumCents: number;
  assumptions: {
    startBalanceCents: number;
    recurringCount: number;
    scheduledCount: number;
    overdueCount: number;
    dailyVariableCents: number;
    hasIncome: boolean;
  };
}

export class GetCashProjectionUseCase {
  constructor(
    private readonly cashflowRepo: CashflowRepository,
    private readonly dashboardRepo: AccountSnapshotReader,
    private readonly occurrencesRepo: RecurringOccurrencesRepository,
    private readonly settings: FamilySettingsRepository,
    private readonly listPeriodStarts: (familyId: number) => Promise<string[]> = async () => [],
  ) {}

  async execute(familyId: number, today: string, options: { days?: number; minimumCents?: number } = {}): Promise<CashProjectionView> {
    const days = options.days ?? DEFAULT_PROJECTION_DAYS;
    const minimumCents = options.minimumCents ?? effectiveMinimumBalance(await this.settings.getMinimumBalanceCents(familyId));
    const endDate = addDays(today, days);
    const tomorrow = addDays(today, 1);

    const [liquid, items, occurrences, scheduled, recentExpenses, periodStarts] = await Promise.all([
      this.dashboardRepo.getLiquidAccounts(familyId, today),
      this.cashflowRepo.getActiveRecurringItems(familyId),
      this.occurrencesRepo.listOccurrences(familyId, addDays(today, -OVERDUE_LOOKBACK_DAYS), endDate),
      this.cashflowRepo.getPlannedScheduled(familyId, today, endDate),
      this.cashflowRepo.getRecentMonthlyExpenseCents(familyId, monthStart(today), MONTHS_FOR_AVERAGE),
      this.listPeriodStarts(familyId),
    ]);

    const closed = new Set(occurrences.filter((o) => o.status !== "pending").map((o) => `${o.recurringItemId}|${o.expectedDate}`));
    const itemById = new Map(items.filter((i) => i.id != null).map((i) => [i.id as number, i]));

    const upcoming = recurringEvents(items, today, endDate, closed, periodStarts);
    const overdue: CashEvent[] = occurrences
      .filter((o) => o.status === "pending" && o.expectedDate <= today && itemById.has(o.recurringItemId))
      .map((o) => ({ date: tomorrow, label: (itemById.get(o.recurringItemId) as { name: string }).name, amountCents: o.expectedAmountCents, source: "recurring" as const }));
    const planned: CashEvent[] = scheduled.map((s) => ({ date: s.scheduledDate, label: s.name, amountCents: s.amountCents, source: "scheduled" as const }));

    const avgMonthlyExpense = recentExpenses.length > 0 ? Math.round(recentExpenses.reduce((a, b) => a + b, 0) / recentExpenses.length) : 0;
    const recurringMonthlyExpense = items.filter((i) => i.estimatedAmountCents < 0).reduce((sum, i) => sum + i.estimatedAmountCents, 0);
    const dailyVariableCents = variableDailyRateCents(avgMonthlyExpense, recurringMonthlyExpense);

    const startBalanceCents = liquid.reduce((sum, a) => sum + a.balanceCents, 0);
    const events = [...upcoming, ...overdue, ...planned];
    const projection = projectDailyBalance({ startDate: today, startBalanceCents, days, events, dailyVariableCents, minimumCents });

    return {
      projection,
      status: cashProjectionStatus(projection, minimumCents, days),
      days,
      minimumCents,
      assumptions: {
        startBalanceCents,
        recurringCount: upcoming.length,
        scheduledCount: planned.length,
        overdueCount: overdue.length,
        dailyVariableCents,
        hasIncome: projection.events.some((e) => e.amountCents > 0),
      },
    };
  }
}
