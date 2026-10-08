import type { CalendarOccurrenceInput } from "@/domain/calendar/rules";
import type { CashflowRepository } from "@/domain/cashflow/ports";
import type { AccountBalance, CreditCardAccount, DailyBalancePoint, DashboardRepository } from "@/domain/dashboard/ports";
import { type AvailableToSpendExplained, type FinancialStatusResult, type RunwayResult, availableToSpend, clampToPeriod, computeRunway, explainAvailableToSpend, upcomingRecurringCommitments } from "@/domain/dashboard/rules";
import { computePeriodFigures } from "@/domain/dashboard/periodFigures";
import { addDays, daysBetweenInclusive, periodLabel } from "@/domain/payPeriod/rules";
import { type NetWorthChange } from "@/domain/wealth/rules";

export interface PayPeriodRange {
  start: string;
  end: string;
}

export interface DashboardSummary {
  period: { start: string; end: string; label: string; daysElapsed: number; daysInPeriod: number };
  availableToSpend: {
    availableCents: number;
    dailyRecommendedCents: number | null;
    liquidBalanceCents: number;
    upcomingCommitmentsCents: number;
  };
  availableToSpendDetail: AvailableToSpendExplained;
  runway: RunwayResult;
  totalBalanceCents: number;
  savingsTotalCents: number;
  savingsAccounts: AccountBalance[];
  debt: {
    totalCents: number;
    paidThisPeriodCents: number;
    overallPercentPaid: number;
  };
  creditCards: Array<CreditCardAccount & { availableCreditCents: number | null }>;
  flow: {
    incomeCents: number;
    expenseCents: number;
    debtPaymentCents: number;
    savingsCents: number;
    remainingCents: number;
  };
  balanceSeries: DailyBalancePoint[];
  financialStatus: FinancialStatusResult;
  wealth: { netWorthCents: number; assetsCents: number; liabilitiesCents: number; change: NetWorthChange };
  savingsRate: { rate: number | null; savedCents: number; yieldCents: number; incomeCents: number; previousRate: number | null };
}

export class GetDashboardSummaryUseCase {
  constructor(
    private readonly repo: DashboardRepository,
    private readonly cashflowRepo: CashflowRepository,
  ) {}

  async execute(
    familyId: number,
    period: PayPeriodRange,
    previousPeriod: PayPeriodRange,
    today: string,
    budgetedTotalCents: number | null,
    recurringOccurrences: CalendarOccurrenceInput[],
    extraCommitments: Array<{ name: string; amountCents: number; date: string }> = [],
  ): Promise<DashboardSummary> {
    const periodStart = period.start;
    const periodEnd = period.end;
    const daysInPeriod = daysBetweenInclusive(periodStart, periodEnd);
    const referenceDate = clampToPeriod(today, periodStart, periodEnd);
    const daysElapsed = today < periodStart ? 0 : daysBetweenInclusive(periodStart, referenceDate);
    const daysRemaining = Math.max(0, daysInPeriod - daysElapsed);

    const { liquidAccounts, savingsAccounts, assetAccounts, creditCardAccounts, otherLiabilityAccounts, flow, priorFlow, scheduled } = await this.loadSnapshot(
      familyId,
      period,
      previousPeriod,
      referenceDate,
    );

    const { availability, availabilityDetail, runway } = this.computeAvailability({
      liquidAccounts,
      recurringOccurrences,
      scheduled,
      extraCommitments,
      referenceDate,
      daysElapsed,
      daysRemaining,
      periodExpenseCents: flow.expenseCents,
    });

    const allLiabilityAccounts = [...creditCardAccounts, ...otherLiabilityAccounts];
    const savingsAccountIds = savingsAccounts.map((a) => a.accountId);

    const history = await this.loadHistory({
      period,
      previousPeriod,
      referenceDate,
      liabilityAccountIds: allLiabilityAccounts.map((a) => a.accountId),
      savingsAccountIds,
      assetAccountIds: assetAccounts.map((a) => a.accountId),
    });
    const [savingsTransfersCents, previousSavingsTransfersCents] = await Promise.all([
      this.repo.getTransfersBetween(savingsAccountIds, periodStart, referenceDate),
      this.repo.getTransfersBetween(savingsAccountIds, previousPeriod.start, previousPeriod.end),
    ]);
    const { earliestBalances, debtAtPeriodStart, savingsAtPeriodStart, balanceSeries, assetsAtPreviousEnd, savingsBeforePreviousPeriod, openingsAfterPreviousEnd, openingsAfterBeforePrevious, debtPaymentsCents } = history;

    const figures = computePeriodFigures({
      flow,
      priorFlow,
      savingsAccounts,
      assetAccounts,
      liabilityAccounts: allLiabilityAccounts,
      creditCardAccounts,
      earliestLiabilityBalancesCents: earliestBalances,
      debtPaymentsCents,
      debtAtPeriodStartCents: debtAtPeriodStart,
      assetsAtPreviousEndCents: assetsAtPreviousEnd,
      savingsTransfersCents,
      previousSavingsTransfersCents,
      savingsAtPeriodStartCents: savingsAtPeriodStart,
      savingsBeforePreviousPeriodCents: savingsBeforePreviousPeriod,
      openingsAfterPreviousEndCents: openingsAfterPreviousEnd,
      openingsAfterBeforePreviousCents: openingsAfterBeforePrevious,
      daysElapsed,
      daysInPeriod,
      budgetedTotalCents,
    });

    return {
      period: { start: periodStart, end: periodEnd, label: periodLabel(periodStart, periodEnd), daysElapsed, daysInPeriod },
      availableToSpend: {
        availableCents: availability.availableCents,
        dailyRecommendedCents: availability.dailyRecommendedCents,
        liquidBalanceCents: availability.liquidBalanceCents,
        upcomingCommitmentsCents: availability.upcomingCommitmentsCents,
      },
      availableToSpendDetail: availabilityDetail,
      runway,
      savingsAccounts,
      balanceSeries,
      ...figures,
    };
  }

  private computeAvailability(input: {
    liquidAccounts: AccountBalance[];
    recurringOccurrences: CalendarOccurrenceInput[];
    scheduled: Array<{ name: string; scheduledDate: string; amountCents: number }>;
    extraCommitments: Array<{ name: string; amountCents: number; date: string }>;
    referenceDate: string;
    daysElapsed: number;
    daysRemaining: number;
    periodExpenseCents: number;
  }) {
    const { liquidAccounts, recurringOccurrences, scheduled, extraCommitments, referenceDate, daysElapsed, daysRemaining, periodExpenseCents } = input;
    const upcomingFromRecurring = upcomingRecurringCommitments(recurringOccurrences, referenceDate).map((c) => ({ amountCents: c.amountCents }));
    const upcomingFromScheduled = scheduled.map((s) => ({ amountCents: s.amountCents }));
    const upcomingFromExtra = extraCommitments.map((c) => ({ amountCents: c.amountCents }));

    const availability = availableToSpend({
      liquidBalanceCents: sumBalances(liquidAccounts),
      upcomingCommitments: [...upcomingFromRecurring, ...upcomingFromScheduled, ...upcomingFromExtra],
      daysRemainingInPeriod: daysRemaining,
    });
    const availabilityDetail = explainAvailableToSpend({
      liquidAccounts: liquidAccounts.map((a) => ({ name: a.name, balanceCents: a.balanceCents })),
      recurringOccurrences,
      scheduled,
      extraCommitments,
      referenceDate,
    });
    const dailyBurnRateCents = daysElapsed > 0 ? Math.abs(periodExpenseCents) / daysElapsed : 0;
    const runway = computeRunway({ availableCents: availability.availableCents, dailyBurnRateCents, daysRemainingInPeriod: daysRemaining });
    return { availability, availabilityDetail, runway };
  }

  private async loadSnapshot(familyId: number, period: PayPeriodRange, previousPeriod: PayPeriodRange, referenceDate: string) {
    const [liquidAccounts, savingsAccounts, assetAccounts, creditCardAccounts, otherLiabilityAccounts, flow, priorFlow, scheduled] = await Promise.all([
      this.repo.getLiquidAccounts(familyId, referenceDate),
      this.repo.getSavingsAccounts(familyId, referenceDate),
      this.repo.getAssetAccounts(familyId, referenceDate),
      this.repo.getCreditCardAccounts(familyId, referenceDate),
      this.repo.getOtherLiabilityAccounts(familyId, referenceDate),
      this.repo.getFlowForDateRange(familyId, period.start, period.end),
      this.repo.getFlowForDateRange(familyId, previousPeriod.start, previousPeriod.end),
      this.cashflowRepo.getPlannedScheduled(familyId, referenceDate, period.end),
    ]);
    return { liquidAccounts, savingsAccounts, assetAccounts, creditCardAccounts, otherLiabilityAccounts, flow, priorFlow, scheduled };
  }

  private async loadHistory(input: {
    period: PayPeriodRange;
    previousPeriod: PayPeriodRange;
    referenceDate: string;
    liabilityAccountIds: number[];
    savingsAccountIds: number[];
    assetAccountIds: number[];
  }) {
    const { period, previousPeriod, referenceDate, liabilityAccountIds, savingsAccountIds, assetAccountIds } = input;
    const beforePreviousPeriod = addDays(previousPeriod.start, -1);
    const [earliestBalances, debtAtPeriodStart, savingsAtPeriodStart, balanceSeries, assetsAtPreviousEnd, savingsBeforePreviousPeriod, openingsAfterPreviousEnd, openingsAfterBeforePrevious, debtPaymentsCents] =
      await Promise.all([
        this.repo.getEarliestBalances(liabilityAccountIds),
        this.repo.getBalanceAt(liabilityAccountIds, previousPeriod.end),
        this.repo.getBalanceAt(savingsAccountIds, previousPeriod.end),
        this.repo.getDailyBalanceSeries(assetAccountIds, period.start, referenceDate),
        this.repo.getBalanceAt(assetAccountIds, previousPeriod.end),
        this.repo.getBalanceAt(savingsAccountIds, beforePreviousPeriod),
        this.repo.getOpeningBalancesAfter(savingsAccountIds, previousPeriod.end),
        this.repo.getOpeningBalancesAfter(savingsAccountIds, beforePreviousPeriod),
        this.repo.getPaymentsInto(liabilityAccountIds, period.start, referenceDate),
      ]);
    return { earliestBalances, debtAtPeriodStart, savingsAtPeriodStart, balanceSeries, assetsAtPreviousEnd, savingsBeforePreviousPeriod, openingsAfterPreviousEnd, openingsAfterBeforePrevious, debtPaymentsCents };
  }
}

function sumBalances(accounts: AccountBalance[]): number {
  return accounts.reduce((sum, a) => sum + a.balanceCents, 0);
}
