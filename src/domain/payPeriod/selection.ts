import { findPeriodIndexContaining, periodLabel, rangeFromPeriods, type PeriodRange } from "./rules";

export interface SelectablePeriod extends PeriodRange {
  id: number;
}

export interface PeriodSelection<T extends SelectablePeriod> {
  currentIndex: number;
  selectedPeriods: T[];
  selectedIds: number[];
  displayPeriod: PeriodRange;
  previousPeriod: T;
}

export function parsePeriodIds(param: string | undefined): number[] {
  if (!param) return [];
  return param
    .split(",")
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
}

export function resolvePeriodSelection<T extends SelectablePeriod>(allPeriods: T[], periodsParam: string | undefined, today: string): PeriodSelection<T> {
  const currentIndex = findPeriodIndexContaining(allPeriods, today);
  const defaultPeriod = allPeriods[currentIndex] ?? allPeriods[0];

  const indexById = new Map(allPeriods.map((period, index) => [period.id, index]));
  const requestedIndexes = new Set(parsePeriodIds(periodsParam).flatMap((id) => (indexById.has(id) ? [indexById.get(id) as number] : [])));
  const selectedPeriods = requestedIndexes.size > 0 ? allPeriods.filter((_, index) => requestedIndexes.has(index)) : [defaultPeriod];

  const firstSelectedIndex = Math.min(...selectedPeriods.map((period) => indexById.get(period.id) ?? 0));
  return {
    currentIndex,
    selectedPeriods,
    selectedIds: selectedPeriods.map((period) => period.id),
    displayPeriod: rangeFromPeriods(selectedPeriods),
    previousPeriod: allPeriods[firstSelectedIndex - 1] ?? selectedPeriods[0],
  };
}

export interface PeriodOption {
  id: number;
  label: string;
  isCurrent: boolean;
}

export function periodOptions(allPeriods: SelectablePeriod[], currentIndex: number): PeriodOption[] {
  return allPeriods.map((period, index) => ({ id: period.id, label: `Quincena ${index + 1} · ${periodLabel(period.start, period.end)}`, isCurrent: index === currentIndex }));
}
