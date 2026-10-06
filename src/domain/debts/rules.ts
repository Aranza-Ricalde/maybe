import { addDays } from "@/domain/payPeriod/rules";
import { daysInMonth } from "@/domain/cashflow/rules";

export const MAX_ANNUAL_RATE_PCT = 300;
export const MAX_PAYOFF_MONTHS = 600;

export interface DebtTerms {
  annualRatePct: number | null;
  minimumPaymentCents: number | null;
  paymentDueDay: number | null;
}

export class InvalidDebtTermsError extends Error {}

export function assertValidDebtTerms(terms: DebtTerms): void {
  const { annualRatePct, minimumPaymentCents, paymentDueDay } = terms;
  if (annualRatePct != null && (!Number.isFinite(annualRatePct) || annualRatePct < 0 || annualRatePct > MAX_ANNUAL_RATE_PCT)) {
    throw new InvalidDebtTermsError(`La tasa anual debe estar entre 0 y ${MAX_ANNUAL_RATE_PCT} %.`);
  }
  if (minimumPaymentCents != null && (!Number.isInteger(minimumPaymentCents) || minimumPaymentCents < 0)) {
    throw new InvalidDebtTermsError("El pago mínimo debe ser un monto positivo.");
  }
  if (paymentDueDay != null && (!Number.isInteger(paymentDueDay) || paymentDueDay < 1 || paymentDueDay > 31)) {
    throw new InvalidDebtTermsError("El día de pago debe estar entre 1 y 31.");
  }
}

const num = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);

export function parseDebtTerms(details: Record<string, unknown> | null): DebtTerms {
  return {
    annualRatePct: num(details?.annualRatePct),
    minimumPaymentCents: num(details?.minimumPaymentCents),
    paymentDueDay: num(details?.paymentDueDay),
  };
}

export function mergeDebtTerms(existing: Record<string, unknown> | null, terms: DebtTerms): Record<string, unknown> | null {
  assertValidDebtTerms(terms);
  const merged: Record<string, unknown> = { ...(existing ?? {}) };
  const set = (key: string, value: number | null) => {
    if (value == null) delete merged[key];
    else merged[key] = value;
  };
  set("annualRatePct", terms.annualRatePct);
  set("minimumPaymentCents", terms.minimumPaymentCents);
  set("paymentDueDay", terms.paymentDueDay);
  return Object.keys(merged).length > 0 ? merged : null;
}

export function monthlyInterestCents(owedCents: number, annualRatePct: number | null): number | null {
  if (annualRatePct == null) return null;
  return Math.round((Math.max(0, owedCents) * annualRatePct) / 100 / 12);
}

export function nextDueDate(today: string, dueDay: number | null): string | null {
  if (dueDay == null) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  let year = Number(today.slice(0, 4));
  let month = Number(today.slice(5, 7));
  for (let i = 0; i < 2; i++) {
    const date = `${year}-${pad(month)}-${pad(Math.min(dueDay, daysInMonth(`${year}-${pad(month)}-01`)))}`;
    if (date >= today) return date;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return null;
}

export type PayoffStatus = "paid" | "payoff" | "never" | "no_payment";

export interface PayoffProjection {
  status: PayoffStatus;
  months: number | null;
  payoffDate: string | null;
  totalInterestCents: number;
}

export function projectPayoff(input: { owedCents: number; annualRatePct: number | null; monthlyPaymentCents: number | null; today: string }): PayoffProjection {
  const owed = Math.max(0, input.owedCents);
  if (owed === 0) return { status: "paid", months: 0, payoffDate: input.today, totalInterestCents: 0 };
  const payment = input.monthlyPaymentCents;
  if (payment == null || payment <= 0) return { status: "no_payment", months: null, payoffDate: null, totalInterestCents: 0 };

  let balance = owed;
  let totalInterest = 0;
  for (let month = 1; month <= MAX_PAYOFF_MONTHS; month++) {
    const interest = monthlyInterestCents(balance, input.annualRatePct) ?? 0;
    if (payment <= interest) return { status: "never", months: null, payoffDate: null, totalInterestCents: 0 };
    totalInterest += interest;
    balance = balance + interest - payment;
    if (balance <= 0) return { status: "payoff", months: month, payoffDate: addDays(input.today, Math.round(month * 30.4)), totalInterestCents: totalInterest };
  }
  return { status: "never", months: null, payoffDate: null, totalInterestCents: 0 };
}

const MONTH_NAMES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const money = (cents: number) => `$${Math.round(Math.abs(cents) / 100).toLocaleString("es-MX")}`;
const dateText = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTH_NAMES[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const monthsText = (months: number) => (months < 12 ? `${months} ${months === 1 ? "mes" : "meses"}` : `${Math.floor(months / 12)} ${Math.floor(months / 12) === 1 ? "año" : "años"}${months % 12 ? ` y ${months % 12} ${months % 12 === 1 ? "mes" : "meses"}` : ""}`);

export function describePayoff(projection: PayoffProjection, label: string, monthlyPaymentCents: number | null): string | null {
  switch (projection.status) {
    case "paid":
      return null;
    case "no_payment":
      return null;
    case "never":
      return `Con ${label} (${monthlyPaymentCents != null ? money(monthlyPaymentCents) : "—"} al mes) la deuda no baja: no alcanza ni para cubrir el interés.`;
    case "payoff": {
      const interest = projection.totalInterestCents > 0 ? ` Pagarías ${money(projection.totalInterestCents)} de interés.` : "";
      return `Con ${label} (${money(monthlyPaymentCents ?? 0)} al mes) la liquidarías en ${monthsText(projection.months as number)}, hacia ${dateText(projection.payoffDate as string)}.${interest}`;
    }
  }
}
