export interface IsoRange {
  start: string;
  end: string;
}

export interface DayRange {
  from: Date | undefined;
  to?: Date | undefined;
}

const pad = (value: number) => String(value).padStart(2, "0");

export function isoToLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function localDateToIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dayRangeFromIso(range: IsoRange | null): DayRange | undefined {
  return range ? { from: isoToLocalDate(range.start), to: isoToLocalDate(range.end) } : undefined;
}

export function isoRangeFromDays(selection: DayRange | undefined): IsoRange | null {
  if (!selection?.from || !selection.to) return null;
  return { start: localDateToIso(selection.from), end: localDateToIso(selection.to) };
}
