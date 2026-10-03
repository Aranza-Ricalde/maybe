import { ACCOUNT_TYPES } from "@/domain/accounts/rules";

export function formatCurrency(cents: number, currency = "MXN"): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(cents === 0 ? 0 : cents / 100);
}

export function centsToInputValue(cents: number | null | undefined): string | undefined {
  return cents != null ? (cents / 100).toFixed(2) : undefined;
}

export function amountSignTone(cents: number): "success" | "default" {
  return cents >= 0 ? "success" : "default";
}

export function amountSignPrefix(cents: number): string {
  return cents >= 0 ? "+" : "";
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(`${isoDate}T00:00:00`),
  );
}

export function formatShortDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(new Date(`${isoDate}T00:00:00`));
}

export function formatMonthYear(isoDate: string): string {
  return new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(new Date(`${isoDate}T00:00:00`));
}

export function formatMonthYearShort(isoDate: string): string {
  return new Intl.DateTimeFormat("es-MX", { month: "short", year: "2-digit" }).format(new Date(`${isoDate}T00:00:00`));
}

export function paymentDaysRemainingLabel(days: number): string {
  if (days < 0) return `Atrasado ${Math.abs(days)} día${days === -1 ? "" : "s"}`;
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  return `En ${days} días`;
}

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "Cuenta de cheques",
  savings: "Ahorro",
  credit_card: "Tarjeta de crédito",
  cash: "Efectivo",
  loan: "Préstamo",
  property: "Propiedad",
  vehicle: "Vehículo",
  other_asset: "Otro activo",
  other_liability: "Otro pasivo",
};

export const ACCOUNT_TYPE_OPTIONS = ACCOUNT_TYPES.map((value) => ({ value, label: ACCOUNT_TYPE_LABELS[value] }));

export const FLOW_OPTIONS = [
  { value: "expense" as const, label: "Gasto" },
  { value: "income" as const, label: "Ingreso" },
];

export const BUDGET_CADENCE_OPTIONS = [
  { value: "monthly" as const, label: "Mensual" },
  { value: "biweekly" as const, label: "Quincenal" },
];
