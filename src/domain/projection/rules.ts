import { shiftMonth } from "@/domain/dashboard/rules";

export const DEFAULT_PROJECTION_MONTHS = 12;
export const MAX_PROJECTION_MONTHS = 36;

export interface ProjectionCategory {
  id: number;
  name: string;
  avgMonthlyCents: number;
  discretionaryShare: number;
}

export interface ProjectionBase {
  currentMonth: string;
  startBalanceCents: number;
  startNetWorthCents: number;
  monthlyIncomeCents: number;
  monthlyExpenseCents: number;
  categories: ProjectionCategory[];
}

export type ScenarioAdjustment =
  | { kind: "cut_category"; categoryId: number; percent: number }
  | { kind: "cut_discretionary"; percent: number }
  | { kind: "monthly_change"; amountCents: number; fromMonth: number }
  | { kind: "one_time"; amountCents: number; month: number }
  | { kind: "allocate"; target: AllocationTarget; amountCents: number; fromMonth: number; repeat: boolean };

export type AllocationTarget = "debt" | "savings";

export class InvalidScenarioError extends Error {}

export function assertValidAdjustment(adjustment: ScenarioAdjustment, months: number): void {
  const isMonth = (n: number) => Number.isInteger(n) && n >= 1 && n <= months;
  switch (adjustment.kind) {
    case "cut_category":
    case "cut_discretionary":
      if (!Number.isFinite(adjustment.percent) || adjustment.percent < 0 || adjustment.percent > 100) {
        throw new InvalidScenarioError("El recorte debe ser un porcentaje entre 0 y 100.");
      }
      return;
    case "monthly_change":
      if (!Number.isInteger(adjustment.amountCents)) throw new InvalidScenarioError("El monto debe estar en centavos enteros.");
      if (!isMonth(adjustment.fromMonth)) throw new InvalidScenarioError(`El mes de inicio debe estar entre 1 y ${months}.`);
      return;
    case "one_time":
      if (!Number.isInteger(adjustment.amountCents)) throw new InvalidScenarioError("El monto debe estar en centavos enteros.");
      if (!isMonth(adjustment.month)) throw new InvalidScenarioError(`El mes debe estar entre 1 y ${months}.`);
      return;
    case "allocate":
      if (adjustment.target !== "debt" && adjustment.target !== "savings") throw new InvalidScenarioError("Solo se puede destinar a deuda o a ahorro.");
      if (!Number.isInteger(adjustment.amountCents) || adjustment.amountCents <= 0) throw new InvalidScenarioError("El monto a destinar debe ser positivo y en centavos enteros.");
      if (!isMonth(adjustment.fromMonth)) throw new InvalidScenarioError(`El mes de inicio debe estar entre 1 y ${months}.`);
      return;
  }
}

export interface ProjectionMonth {
  month: string;
  baselineBalanceCents: number;
  scenarioBalanceCents: number;
  baselineNetWorthCents: number;
  scenarioNetWorthCents: number;
  scenarioEffectCents: number;
}

export interface ProjectionResult {
  months: ProjectionMonth[];
  baselineMonthlyNetCents: number;
  scenarioMonthlyNetCents: number;
  finalBaselineCents: number;
  finalScenarioCents: number;
  finalBaselineNetWorthCents: number;
  finalScenarioNetWorthCents: number;
  differenceCents: number;
  runwayMonths: number | null;
  allocatedToDebtCents: number;
  allocatedToSavingsCents: number;
}

function monthlyCutSavingsCents(base: ProjectionBase, adjustments: ScenarioAdjustment[]): number {
  const categoryCut = new Map<number, number>();
  let discretionaryCut = 0;
  for (const a of adjustments) {
    if (a.kind === "cut_category") categoryCut.set(a.categoryId, Math.min(100, (categoryCut.get(a.categoryId) ?? 0) + a.percent));
    if (a.kind === "cut_discretionary") discretionaryCut = Math.min(100, discretionaryCut + a.percent);
  }
  let savings = 0;
  for (const c of base.categories) {
    const keep = (1 - (categoryCut.get(c.id) ?? 0) / 100) * (1 - (discretionaryCut / 100) * c.discretionaryShare);
    savings += c.avgMonthlyCents * (1 - keep);
  }
  return Math.round(savings);
}

export function projectBalance(base: ProjectionBase, adjustments: ScenarioAdjustment[] = [], monthsCount = DEFAULT_PROJECTION_MONTHS): ProjectionResult {
  if (!Number.isInteger(monthsCount) || monthsCount < 1 || monthsCount > MAX_PROJECTION_MONTHS) {
    throw new InvalidScenarioError(`La proyección admite entre 1 y ${MAX_PROJECTION_MONTHS} meses.`);
  }
  adjustments.forEach((a) => assertValidAdjustment(a, monthsCount));

  const baselineNet = base.monthlyIncomeCents - base.monthlyExpenseCents;
  const cutSavings = monthlyCutSavingsCents(base, adjustments);

  const isAllocatedIn = (a: Extract<ScenarioAdjustment, { kind: "allocate" }>, monthIndex: number) => (a.repeat ? monthIndex >= a.fromMonth : monthIndex === a.fromMonth);
  const allocatedIn = (monthIndex: number, target: AllocationTarget): number =>
    adjustments.reduce((sum, a) => (a.kind === "allocate" && a.target === target && isAllocatedIn(a, monthIndex) ? sum + a.amountCents : sum), 0);

  const wealthEffectOf = (monthIndex: number): number =>
    cutSavings +
    adjustments.reduce((sum, a) => {
      if (a.kind === "monthly_change" && monthIndex >= a.fromMonth) return sum + a.amountCents;
      if (a.kind === "one_time" && monthIndex === a.month) return sum + a.amountCents;
      return sum;
    }, 0);
  const effectOf = (monthIndex: number): number => wealthEffectOf(monthIndex) - allocatedIn(monthIndex, "debt") - allocatedIn(monthIndex, "savings");

  let baseline = base.startBalanceCents;
  let scenario = base.startBalanceCents;
  let baselineWealth = base.startNetWorthCents;
  let scenarioWealth = base.startNetWorthCents;
  const months: ProjectionMonth[] = [];
  for (let i = 1; i <= monthsCount; i++) {
    const effect = effectOf(i);
    baseline += baselineNet;
    scenario += baselineNet + effect;
    baselineWealth += baselineNet;
    scenarioWealth += baselineNet + wealthEffectOf(i);
    months.push({
      month: shiftMonth(base.currentMonth, i),
      baselineBalanceCents: baseline,
      scenarioBalanceCents: scenario,
      baselineNetWorthCents: baselineWealth,
      scenarioNetWorthCents: scenarioWealth,
      scenarioEffectCents: effect,
    });
  }

  const last = months[months.length - 1];
  return {
    months,
    baselineMonthlyNetCents: baselineNet,
    scenarioMonthlyNetCents: baselineNet + effectOf(1),
    finalBaselineCents: last.baselineBalanceCents,
    finalScenarioCents: last.scenarioBalanceCents,
    finalBaselineNetWorthCents: last.baselineNetWorthCents,
    finalScenarioNetWorthCents: last.scenarioNetWorthCents,
    differenceCents: last.scenarioBalanceCents - last.baselineBalanceCents,
    runwayMonths: base.monthlyExpenseCents > 0 ? Math.max(0, base.startBalanceCents) / base.monthlyExpenseCents : null,
    allocatedToDebtCents: months.reduce((sum, _m, i) => sum + allocatedIn(i + 1, "debt"), 0),
    allocatedToSavingsCents: months.reduce((sum, _m, i) => sum + allocatedIn(i + 1, "savings"), 0),
  };
}
