export const APP_TIMEZONE = process.env.APP_TIMEZONE || "America/Mexico_City";

export function todayIso(now: Date = new Date(), timeZone: string = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function currentHour(now: Date = new Date(), timeZone: string = APP_TIMEZONE): number {
  const hour = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" }).format(now);
  return Number(hour);
}
