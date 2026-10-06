export interface UpcomingCommitment {
  amountCents: number;
}

export interface AvailableToSpendInput {
  liquidBalanceCents: number;
  upcomingCommitments: UpcomingCommitment[];
  daysRemainingInPeriod: number;
}

export interface AvailableToSpendResult {
  liquidBalanceCents: number;
  upcomingCommitmentsCents: number;
  availableCents: number;
  dailyRecommendedCents: number | null;
}

export function availableToSpend(input: AvailableToSpendInput): AvailableToSpendResult {
  const upcomingCommitmentsCents = input.upcomingCommitments.reduce((sum, c) => sum + c.amountCents, 0);
  const availableCents = input.liquidBalanceCents + upcomingCommitmentsCents;
  const dailyRecommendedCents =
    input.daysRemainingInPeriod > 0 ? Math.round(availableCents / input.daysRemainingInPeriod) : null;

  return { liquidBalanceCents: input.liquidBalanceCents, upcomingCommitmentsCents, availableCents, dailyRecommendedCents };
}

export interface AvailableToSpendCommitmentItem {
  name: string;
  amountCents: number;
  date: string;
}

export interface OccurrenceForCommitments {
  name: string;
  expectedDate: string;
  expectedAmountCents: number;
  status: "pending" | "paid" | "skipped";
}

export function upcomingRecurringCommitments(occurrences: OccurrenceForCommitments[], referenceDate: string): AvailableToSpendCommitmentItem[] {
  return occurrences
    .filter((o) => o.status === "pending" && o.expectedDate > referenceDate && o.expectedAmountCents < 0)
    .map((o) => ({ name: o.name, amountCents: o.expectedAmountCents, date: o.expectedDate }));
}

export interface ExplainAvailableToSpendInput {
  liquidAccounts: Array<{ name: string; balanceCents: number }>;
  recurringOccurrences: OccurrenceForCommitments[];
  scheduled: Array<{ name: string; scheduledDate: string; amountCents: number }>;
  extraCommitments?: AvailableToSpendCommitmentItem[];
  referenceDate: string;
}

export interface AvailableToSpendExplained {
  liquidAccounts: Array<{ name: string; balanceCents: number }>;
  liquidBalanceCents: number;
  commitments: AvailableToSpendCommitmentItem[];
  commitmentsCents: number;
  availableCents: number;
}

export function explainAvailableToSpend(input: ExplainAvailableToSpendInput): AvailableToSpendExplained {
  const liquidBalanceCents = input.liquidAccounts.reduce((sum, a) => sum + a.balanceCents, 0);

  const fromRecurring = upcomingRecurringCommitments(input.recurringOccurrences, input.referenceDate);

  const fromScheduled: AvailableToSpendCommitmentItem[] = input.scheduled.map((s) => ({
    name: s.name,
    amountCents: s.amountCents,
    date: s.scheduledDate,
  }));

  const commitments = [...fromRecurring, ...fromScheduled, ...(input.extraCommitments ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const commitmentsCents = commitments.reduce((sum, c) => sum + c.amountCents, 0);

  return {
    liquidAccounts: input.liquidAccounts,
    liquidBalanceCents,
    commitments,
    commitmentsCents,
    availableCents: liquidBalanceCents + commitmentsCents,
  };
}

export type FinancialStatusLevel = "green" | "yellow" | "red";

export interface FinancialStatusInput {
  incomeCentsThisPeriod: number;
  expenseCentsThisPeriod: number;
  incomeCentsPriorPeriod: number;
  expenseCentsPriorPeriod: number;
  daysElapsedInPeriod: number;
  daysInPeriod: number;
  budgetedTotalCents: number | null;
}

export interface FinancialStatusResult {
  level: FinancialStatusLevel;
  message: string;
  detail: string;
}

export function financialStatus(input: FinancialStatusInput): FinancialStatusResult {
  const elapsedPct = input.daysInPeriod > 0 ? input.daysElapsedInPeriod / input.daysInPeriod : 0;
  const expenseMagnitude = Math.abs(input.expenseCentsThisPeriod);
  const hasIncome = input.incomeCentsThisPeriod > 0;
  const spentOfIncomePct = hasIncome ? expenseMagnitude / input.incomeCentsThisPeriod : 0;

  const projectedTotalExpenseCents =
    input.daysElapsedInPeriod > 0 ? Math.round((expenseMagnitude / input.daysElapsedInPeriod) * input.daysInPeriod) : 0;

  const daysLabel = `${input.daysElapsedInPeriod} de ${input.daysInPeriod} días`;
  const detail = hasIncome
    ? `${Math.round(spentOfIncomePct * 100)}% de tus ingresos usado, ${daysLabel}.`
    : expenseMagnitude > 0
      ? `Gasto sin ingresos registrados aún, ${daysLabel}.`
      : `Sin movimientos registrados aún, ${daysLabel}.`;

  if (input.budgetedTotalCents != null && projectedTotalExpenseCents > input.budgetedTotalCents) {
    return { level: "red", message: "Podrías terminar el periodo por encima de tu presupuesto.", detail };
  }
  if (!hasIncome && expenseMagnitude > 0) {
    return { level: "yellow", message: "Estás gastando sin ingresos registrados todavía este periodo.", detail };
  }
  if (spentOfIncomePct > elapsedPct + 0.15) {
    return { level: "red", message: "Estás gastando más rápido de lo que ganas este periodo.", detail };
  }

  const expenseGrowth = growthRate(Math.abs(input.expenseCentsPriorPeriod), expenseMagnitude);
  const incomeGrowth = growthRate(input.incomeCentsPriorPeriod, input.incomeCentsThisPeriod);
  if (expenseGrowth > incomeGrowth + 0.1) {
    return { level: "yellow", message: "Tus gastos están creciendo más rápido que tus ingresos.", detail };
  }
  if (spentOfIncomePct > elapsedPct) {
    return { level: "yellow", message: "Vas un poco por delante de tu ritmo habitual de gasto.", detail };
  }

  return {
    level: "green",
    message: input.budgetedTotalCents != null ? "Vas dentro de tu presupuesto." : "Vas a buen ritmo: gastas menos de lo que ganas.",
    detail,
  };
}

function growthRate(prior: number, current: number): number {
  if (prior <= 0) return current > 0 ? 1 : 0;
  return (current - prior) / prior;
}

export interface DebtProgressResult {
  paidCents: number;
  percentPaid: number;
}

export function debtProgress(currentDebtCents: number, earliestDebtCents: number): DebtProgressResult {
  const currentDebt = Math.max(0, currentDebtCents);
  const earliestDebt = Math.max(0, earliestDebtCents);
  if (earliestDebt <= 0) return { paidCents: 0, percentPaid: 0 };
  const paidCents = Math.max(0, earliestDebt - currentDebt);
  return { paidCents, percentPaid: Math.min(1, paidCents / earliestDebt) };
}

export interface GoalProgressResult {
  currentCents: number;
  percent: number;
}

export function goalProgress(currentCents: number, targetCents: number): GoalProgressResult {
  const clampedCurrent = Math.max(0, currentCents);
  if (targetCents <= 0) return { currentCents: clampedCurrent, percent: 0 };
  return { currentCents: clampedCurrent, percent: Math.min(1, clampedCurrent / targetCents) };
}

export interface CreditCardSummary {
  limitCents: number;
  usedCents: number;
  availableCents: number;
}

export function creditCardSummary(limitCents: number, usedCents: number): CreditCardSummary {
  return { limitCents, usedCents, availableCents: Math.max(0, limitCents - usedCents) };
}

export function clampToPeriod(today: string, periodStart: string, periodEnd: string): string {
  if (today < periodStart) return periodStart;
  if (today > periodEnd) return periodEnd;
  return today;
}

export type RunwayLevel = "green" | "yellow" | "red";

export interface RunwayInput {
  availableCents: number;
  dailyBurnRateCents: number;
  daysRemainingInPeriod: number;
}

export interface RunwayResult {
  level: RunwayLevel;
  message: string;
  runwayDays: number | null;
}

export function computeRunway(input: RunwayInput): RunwayResult {
  if (input.availableCents <= 0) {
    return { level: "red", message: "Ya no tienes disponible para lo que resta del periodo.", runwayDays: 0 };
  }
  if (input.dailyBurnRateCents <= 0) {
    return { level: "green", message: "A tu ritmo actual, te alcanza hasta el fin del periodo.", runwayDays: null };
  }

  const runwayDays = Math.floor(input.availableCents / input.dailyBurnRateCents);
  if (runwayDays >= input.daysRemainingInPeriod) {
    return { level: "green", message: "A tu ritmo actual, te alcanza hasta el fin del periodo.", runwayDays };
  }
  const level: RunwayLevel = runwayDays < input.daysRemainingInPeriod / 2 ? "red" : "yellow";
  return { level, message: `A tu ritmo actual, se te acaba en ${runwayDays} día${runwayDays === 1 ? "" : "s"}.`, runwayDays };
}

export function shiftMonth(monthIso: string, delta: number): string {
  const [year, month] = monthIso.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

