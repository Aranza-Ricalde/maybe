import { transactionsDrilldownHref } from "@/domain/shared/routes";
export const MONTH_NAMES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const monthName = (monthIso: string) => MONTH_NAMES[Number(monthIso.slice(5, 7)) - 1];
export const pesos = (cents: number) => `$${Math.round(Math.abs(cents) / 100).toLocaleString("es-MX")}`;
export const pct = (ratio: number) => `${Math.round(Math.abs(ratio) * 100)}%`;
export const DAY_MS = 86_400_000;
export const daysBetween = (a: string, b: string) => Math.round(Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / DAY_MS);
export const shortDate = (iso: string) => `${Number(iso.slice(8, 10))} ${monthName(iso).slice(0, 3)}`;
export const drilldown = transactionsDrilldownHref;
