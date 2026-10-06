export const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"] as const;

const DAYS_FUTURE_TOLERANCE = 1;
const MS_PER_DAY = 86_400_000;

const pad = (value: number) => String(value).padStart(2, "0");

export const monthIndex = (name: string) => MONTHS.indexOf(name.toLowerCase() as (typeof MONTHS)[number]);

export function isRealDate(year: number, month: number, day: number): boolean {
  const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
  const parsed = Date.parse(`${iso}T00:00:00Z`);
  return !Number.isNaN(parsed) && new Date(parsed).toISOString().slice(0, 10) === iso;
}

export function inferDate(day: number, month: number, explicitYear: number | undefined, today: string): string | undefined {
  const todayYear = Number(today.slice(0, 4));
  const iso = (year: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const year = explicitYear ?? todayYear;
  if (!isRealDate(year, month, day)) return undefined;
  if (explicitYear) return iso(year);
  const limit = Date.parse(`${today}T00:00:00Z`) + DAYS_FUTURE_TOLERANCE * MS_PER_DAY;
  return Date.parse(`${iso(year)}T00:00:00Z`) > limit && isRealDate(year - 1, month, day) ? iso(year - 1) : iso(year);
}
