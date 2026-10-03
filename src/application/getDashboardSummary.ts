import type { CashflowRepository } from "@/domain/cashflow/ports";
import type { AccountBalance, CreditCardAccount, DailyBalancePoint, DashboardRepository } from "@/domain/dashboard/ports";
import {
  type AvailableToSpendExplained,
  type FinancialStatusResult,
  type RunwayResult,
  availableToSpend,
  clampToPeriod,
  computeRunway,
  creditCardSummary,
  debtProgress,
  explainAvailableToSpend,
  financialStatus,
} from "@/domain/dashboard/rules";
import { daysBetweenInclusive, periodLabel, resolveDayOfMonthWithinRange } from "@/domain/payPeriod/rules";

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
  ): Promise<DashboardSummary> {
    const periodStart = period.start;
    const periodEnd = period.end;
    const daysInPeriod = daysBetweenInclusive(periodStart, periodEnd);
    const referenceDate = clampToPeriod(today, periodStart, periodEnd);
    const daysElapsed = today < periodStart ? 0 : daysBetweenInclusive(periodStart, referenceDate);
    const daysRemaining = Math.max(0, daysInPeriod - daysElapsed);
    const previousPeriodEnd = previousPeriod.end;

    const [liquidAccounts, savingsAccounts, assetAccounts, creditCardAccounts, otherLiabilityAccounts, flow, priorFlow, recurringItems, scheduled] =
      await Promise.all([
        this.repo.getLiquidAccounts(familyId, referenceDate),
        this.repo.getSavingsAccounts(familyId, referenceDate),
        this.repo.getAssetAccounts(familyId, referenceDate),
        this.repo.getCreditCardAccounts(familyId, referenceDate),
        this.repo.getOtherLiabilityAccounts(familyId, referenceDate),
        this.repo.getFlowForDateRange(familyId, periodStart, periodEnd),
        this.repo.getFlowForDateRange(familyId, previousPeriod.start, previousPeriod.end),
        this.cashflowRepo.getActiveRecurringItems(familyId),
        this.cashflowRepo.getPlannedScheduled(familyId, referenceDate, periodEnd),
      ]);

    const liquidBalanceCents = sumBalances(liquidAccounts);
    const upcomingFromRecurring = recurringItems
      .map((r) => ({ r, occursOn: resolveDayOfMonthWithinRange(r.dayOfMonth, periodStart, periodEnd) }))
      .filter((x): x is { r: (typeof recurringItems)[number]; occursOn: string } => x.occursOn !== null && x.occursOn > referenceDate)
      .map((x) => ({ amountCents: x.r.estimatedAmountCents }));
    const upcomingFromScheduled = scheduled.map((s) => ({ amountCents: s.amountCents }));

    const availability = availableToSpend({
      liquidBalanceCents,
      upcomingCommitments: [...upcomingFromRecurring, ...upcomingFromScheduled],
      daysRemainingInPeriod: daysRemaining,
    });

    const availabilityDetail = explainAvailableToSpend({
      liquidAccounts: liquidAccounts.map((a) => ({ name: a.name, balanceCents: a.balanceCents })),
      recurringItems,
      scheduled,
      referenceDate,
      periodStart,
      periodEnd,
    });

    const dailyBurnRateCents = daysElapsed > 0 ? Math.abs(flow.expenseCents) / daysElapsed : 0;
    const runway = computeRunway({
      availableCents: availability.availableCents,
      dailyBurnRateCents,
      daysRemainingInPeriod: daysRemaining,
    });

    const creditCardDebtCents = sumBalances(creditCardAccounts);
    const otherLiabilityDebtCents = sumBalances(otherLiabilityAccounts);
    const totalDebtCents = creditCardDebtCents + otherLiabilityDebtCents;

    const allLiabilityAccounts = [...creditCardAccounts, ...otherLiabilityAccounts];
    const savingsAccountIds = savingsAccounts.map((a) => a.accountId);

    const [earliestBalances, debtAtPeriodStart, savingsAtPeriodStart, balanceSeries] = await Promise.all([
      Promise.all(allLiabilityAccounts.map((a) => this.repo.getEarliestBalance(a.accountId))),
      this.repo.getBalanceAt(allLiabilityAccounts.map((a) => a.accountId), previousPeriodEnd),
      this.repo.getBalanceAt(savingsAccountIds, previousPeriodEnd),
      this.repo.getDailyBalanceSeries(assetAccounts.map((a) => a.accountId), periodStart, referenceDate),
    ]);

    const earliestTotalDebtCents = earliestBalances.reduce((sum, b) => sum + b, 0);
    const progress = debtProgress(totalDebtCents, earliestTotalDebtCents);
    const paidThisPeriodCents = Math.max(0, Math.abs(debtAtPeriodStart) - Math.abs(totalDebtCents));
    const savingsContributedCents = sumBalances(savingsAccounts) - savingsAtPeriodStart;

    const status = financialStatus({
      incomeCentsThisPeriod: flow.incomeCents,
      expenseCentsThisPeriod: flow.expenseCents,
      incomeCentsPriorPeriod: priorFlow.incomeCents,
      expenseCentsPriorPeriod: priorFlow.expenseCents,
      daysElapsedInPeriod: daysElapsed,
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
      totalBalanceCents: sumBalances(assetAccounts),
      savingsTotalCents: sumBalances(savingsAccounts),
      savingsAccounts,
      debt: { totalCents: totalDebtCents, paidThisPeriodCents, overallPercentPaid: progress.percentPaid },
      creditCards: creditCardAccounts.map((c) => ({
        ...c,
        availableCreditCents: c.creditLimitCents != null ? creditCardSummary(c.creditLimitCents, Math.abs(c.balanceCents)).availableCents : null,
      })),
      flow: {
        incomeCents: flow.incomeCents,
        expenseCents: flow.expenseCents,
        debtPaymentCents: -paidThisPeriodCents,
        savingsCents: -savingsContributedCents,
        remainingCents: flow.incomeCents + flow.expenseCents - savingsContributedCents - paidThisPeriodCents,
      },
      balanceSeries,
      financialStatus: status,
    };
  }
}

function sumBalances(accounts: AccountBalance[]): number {
  return accounts.reduce((sum, a) => sum + a.balanceCents, 0);
}
