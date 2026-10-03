import { resolveDayOfMonthWithinRange } from "@/domain/payPeriod/rules";

export interface CalendarRecurringInput {
  name: string;
  flow: "income" | "expense";
  status: "active" | "paused";
  dayOfMonth: number;
  estimatedAmountCents: number;
  accountId: number | null;
  categoryId: number | null;
  conceptId: number | null;
}

export interface CalendarScheduledInput {
  name: string;
  amountCents: number;
  scheduledDate: string;
  status: "planned" | "confirmed" | "cancelled";
  accountId: number | null;
  categoryId: number | null;
}

export interface CalendarTransactionInput {
  name: string;
  date: string;
  amountCents: number;
  accountId: number;
  categoryId: number | null;
  conceptId: number | null;
}

export type CalendarEntrySource = "recurrente" | "programado";
export type CalendarEntryStatus = "paid" | "pending" | "overdue";

export interface CalendarEntry {
  name: string;
  flow: "income" | "expense";
  source: CalendarEntrySource;
  expectedDate: string;
  expectedAmountCents: number;
  status: CalendarEntryStatus;
  actualName: string | null;
  actualDate: string | null;
  actualAmountCents: number | null;
}

function findMatchingTransactionForRecurring(
  r: CalendarRecurringInput,
  periodTransactions: CalendarTransactionInput[],
): CalendarTransactionInput | null {
  if (r.conceptId != null) {
    return periodTransactions.find((t) => t.conceptId === r.conceptId) ?? null;
  }
  if (r.accountId != null) {
    return periodTransactions.find((t) => t.accountId === r.accountId && t.categoryId === r.categoryId) ?? null;
  }
  return null;
}

function findMatchingTransactionForScheduled(
  s: CalendarScheduledInput,
  periodTransactions: CalendarTransactionInput[],
): CalendarTransactionInput | null {
  if (s.accountId == null) return null;
  return periodTransactions.find((t) => t.accountId === s.accountId && t.categoryId === s.categoryId) ?? null;
}

function buildEntry(
  name: string,
  flow: "income" | "expense",
  source: CalendarEntrySource,
  expectedDate: string,
  expectedAmountCents: number,
  match: CalendarTransactionInput | null,
  today: string,
): CalendarEntry {
  const status: CalendarEntryStatus = match ? "paid" : expectedDate < today ? "overdue" : "pending";
  return {
    name,
    flow,
    source,
    expectedDate,
    expectedAmountCents,
    status,
    actualName: match?.name ?? null,
    actualDate: match?.date ?? null,
    actualAmountCents: match?.amountCents ?? null,
  };
}

/**
 * Entradas REAL vs ESPERADO para el periodo visible (principios.md #21), fusionando recurrentes
 * y pagos programados en una sola vista: a diferencia de un simple "próximos pagos", aquí se
 * listan TODOS los del periodo (pasados y futuros, pagados o no) — nunca se oculta uno ya
 * pagado, y se expone la transacción real que lo cubrió.
 */
export function financialCalendarEntries(
  recurring: CalendarRecurringInput[],
  scheduled: CalendarScheduledInput[],
  periodTransactions: CalendarTransactionInput[],
  today: string,
  periodStart: string,
  periodEnd: string,
): CalendarEntry[] {
  const fromRecurring: CalendarEntry[] = recurring
    .filter((r) => r.status === "active")
    .map((r) => ({ r, expectedDate: resolveDayOfMonthWithinRange(r.dayOfMonth, periodStart, periodEnd) }))
    .filter((x): x is { r: CalendarRecurringInput; expectedDate: string } => x.expectedDate != null)
    .map(({ r, expectedDate }) =>
      buildEntry(r.name, r.flow, "recurrente", expectedDate, r.estimatedAmountCents, findMatchingTransactionForRecurring(r, periodTransactions), today),
    );

  const fromScheduled: CalendarEntry[] = scheduled
    .filter((s) => s.status === "planned" && s.amountCents < 0 && s.scheduledDate >= periodStart && s.scheduledDate <= periodEnd)
    .map((s) =>
      buildEntry(s.name, "expense", "programado", s.scheduledDate, s.amountCents, findMatchingTransactionForScheduled(s, periodTransactions), today),
    );

  return [...fromRecurring, ...fromScheduled].sort((a, b) => a.expectedDate.localeCompare(b.expectedDate));
}

export interface GroupedCalendarEntries {
  pending: CalendarEntry[];
  paid: CalendarEntry[];
}

/**
 * Separa lo que falta por pagar (atrasado primero, luego pendiente por fecha) de lo ya pagado,
 * para que "qué me falta" nunca quede enterrado entre lo histórico — sin perder la vista completa.
 */
export function groupCalendarEntriesByStatus(entries: CalendarEntry[]): GroupedCalendarEntries {
  const pending = entries
    .filter((e) => e.status !== "paid")
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "overdue" ? -1 : 1;
      return a.expectedDate.localeCompare(b.expectedDate);
    });
  const paid = entries.filter((e) => e.status === "paid").sort((a, b) => a.expectedDate.localeCompare(b.expectedDate));
  return { pending, paid };
}
