import { DEFAULT_PERIOD_VIEW, groupPeriodsByMonth, monthKeyOf, monthName, withMonthShare, type PeriodView } from "./periodView";
import { findPeriodIndexContaining, periodLabel, rangeFromPeriods, type PeriodRange } from "./rules";

export interface SelectablePeriod extends PeriodRange {
  id: number;
}

export interface PeriodSelection<T extends SelectablePeriod> {
  view: PeriodView;
  currentIndex: number;
  selectedPeriods: Array<T & { monthShare: number }>;
  selectedIds: number[];
  displayPeriod: PeriodRange;
  previousRange: PeriodRange;
}

export function parsePeriodIds(param: string | undefined): number[] {
  if (!param) return [];
  return param
    .split(",")
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
}

function expandToMonths<T extends SelectablePeriod>(allPeriods: T[], periods: T[]): T[] {
  const keys = new Set(periods.map(monthKeyOf));
  return allPeriods.filter((period) => keys.has(monthKeyOf(period)));
}

export function resolvePeriodSelection<T extends SelectablePeriod>(allPeriods: T[], periodsParam: string | undefined, today: string, view: PeriodView = DEFAULT_PERIOD_VIEW): PeriodSelection<T> {
  const currentIndex = findPeriodIndexContaining(allPeriods, today);
  const defaultPeriod = allPeriods[currentIndex] ?? allPeriods[0];

  const indexById = new Map(allPeriods.map((period, index) => [period.id, index]));
  const requestedIndexes = new Set(parsePeriodIds(periodsParam).flatMap((id) => (indexById.has(id) ? [indexById.get(id) as number] : [])));
  const requested = requestedIndexes.size > 0 ? allPeriods.filter((_, index) => requestedIndexes.has(index)) : [defaultPeriod];
  const chosen = view === "monthly" ? expandToMonths(allPeriods, requested) : requested;

  const indexesChosen = chosen.map((period) => indexById.get(period.id) ?? 0);
  const firstIndex = Math.min(...indexesChosen);
  const previous = allPeriods.slice(Math.max(0, firstIndex - chosen.length), firstIndex);
  const selectedIds = view === "monthly" ? groupPeriodsByMonth(chosen).map((month) => month.periods[0].id) : chosen.map((period) => period.id);

  return {
    view,
    currentIndex,
    selectedPeriods: withMonthShare(allPeriods, chosen),
    selectedIds,
    displayPeriod: rangeFromPeriods(chosen),
    previousRange: rangeFromPeriods(previous.length > 0 ? previous : chosen),
  };
}

export interface PeriodOption {
  id: number;
  label: string;
  isCurrent: boolean;
}

export function periodOptions(allPeriods: SelectablePeriod[], currentIndex: number, view: PeriodView = "biweekly"): PeriodOption[] {
  if (view === "biweekly") {
    return allPeriods.map((period, index) => ({ id: period.id, label: `Quincena ${index + 1} · ${periodLabel(period.start, period.end)}`, isCurrent: index === currentIndex }));
  }
  const currentKey = allPeriods[currentIndex] ? monthKeyOf(allPeriods[currentIndex]) : null;
  return groupPeriodsByMonth(allPeriods).map((month) => {
    const range = rangeFromPeriods(month.periods);
    return { id: month.periods[0].id, label: `${monthName(month.key)} · ${periodLabel(range.start, range.end)}`, isCurrent: month.key === currentKey };
  });
}
