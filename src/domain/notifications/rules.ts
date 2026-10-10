import type { CalendarEntry } from "@/domain/calendar/rules";
import { addDays } from "@/domain/payPeriod/rules";

export const NOTIFICATION_KINDS = ["payment_due", "payment_late", "budget_warning", "budget_exceeded", "cash_negative", "pending_decisions", "statement_ready"] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const BUDGET_WARNING_RATIO = 0.8;
export const PAYMENT_ADVANCE_DAYS = 2;
export const CASH_WORSENING_RATIO = 0.25;
export const CASH_WORSENING_MIN_CENTS = 50_000;
export const CASH_REMINDER_DAYS = 7;
export const PENDING_REMINDER_DAYS = 3;
export const RETENTION_DAYS = 60;

export interface PlannedNotification {
  kind: NotificationKind;
  dedupeKey: string;
  title: string;
  body: string;
  href: string;
  payload: Record<string, number | string>;
}

export interface BudgetLineInput {
  categoryId: number;
  name: string;
  budgetCents: number;
  spentCents: number;
  isSavings: boolean;
}

export interface LastNotification {
  createdAt: string;
  resolved: boolean;
  payload: Record<string, unknown>;
}

export interface NotificationInput {
  today: string;
  periodStart: string;
  entries: CalendarEntry[];
  budgetLines: BudgetLineInput[];
  availableCents: number;
  pendingDecisions: number;
  lastCash: LastNotification | null;
  lastPending: LastNotification | null;
}

const money = (cents: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Math.abs(cents) / 100);

const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

const entryId = (entry: CalendarEntry) => (entry.occurrenceId != null ? `o${entry.occurrenceId}` : `${entry.source}:${entry.name}:${entry.expectedDate}`);

export function planPaymentNotifications(entries: CalendarEntry[], today: string): PlannedNotification[] {
  return entries
    .filter((entry) => entry.flow === "expense" && (entry.status === "pending" || entry.status === "overdue"))
    .flatMap((entry): PlannedNotification[] => {
      const days = daysBetween(today, entry.expectedDate);
      const amount = money(entry.expectedAmountCents);
      const base = { href: "/", payload: { name: entry.name, amountCents: Math.abs(entry.expectedAmountCents), date: entry.expectedDate } };
      if (days < 0) {
        return [{ ...base, kind: "payment_late", dedupeKey: `late:${entryId(entry)}`, title: `Pago atrasado: ${entry.name}`, body: `Venció el ${entry.expectedDate} y sigue sin marcarse como pagado (${amount}).` }];
      }
      if (days === 0) {
        return [{ ...base, kind: "payment_due", dedupeKey: `due0:${entryId(entry)}`, title: `Hoy vence: ${entry.name}`, body: `${amount} por pagar hoy.` }];
      }
      if (days === PAYMENT_ADVANCE_DAYS) {
        return [{ ...base, kind: "payment_due", dedupeKey: `due${PAYMENT_ADVANCE_DAYS}:${entryId(entry)}`, title: `En ${days} días vence: ${entry.name}`, body: `${amount} el ${entry.expectedDate}.` }];
      }
      return [];
    });
}

export function planBudgetNotifications(lines: BudgetLineInput[], periodStart: string): PlannedNotification[] {
  return lines
    .filter((line) => !line.isSavings && line.budgetCents > 0)
    .flatMap((line): PlannedNotification[] => {
      const ratio = Math.abs(line.spentCents) / line.budgetCents;
      const base = { href: "/budgets", payload: { categoryId: line.categoryId, name: line.name, budgetCents: line.budgetCents, spentCents: Math.abs(line.spentCents) } };
      if (ratio > 1) {
        return [{ ...base, kind: "budget_exceeded", dedupeKey: `budget100:${line.categoryId}:${periodStart}`, title: `Te pasaste en ${line.name}`, body: `Llevas ${money(line.spentCents)} de ${money(line.budgetCents)}.` }];
      }
      if (ratio >= BUDGET_WARNING_RATIO) {
        return [{ ...base, kind: "budget_warning", dedupeKey: `budget80:${line.categoryId}:${periodStart}`, title: `${line.name}: ya usaste ${Math.round(ratio * 100)} %`, body: `Te quedan ${money(line.budgetCents - Math.abs(line.spentCents))} de ${money(line.budgetCents)}.` }];
      }
      return [];
    });
}

export function shouldNotifyCashNegative(availableCents: number, last: LastNotification | null, today: string): boolean {
  if (availableCents >= 0) return false;
  if (!last || last.resolved) return true;
  const previousDeficit = Number(last.payload.deficitCents ?? 0);
  const deficit = Math.abs(availableCents);
  const worsenedBy = deficit - previousDeficit;
  if (worsenedBy >= Math.max(CASH_WORSENING_MIN_CENTS, previousDeficit * CASH_WORSENING_RATIO)) return true;
  return daysBetween(last.createdAt.slice(0, 10), today) >= CASH_REMINDER_DAYS;
}

export function planCashNotification(availableCents: number, last: LastNotification | null, today: string): PlannedNotification | null {
  if (!shouldNotifyCashNegative(availableCents, last, today)) return null;
  return {
    kind: "cash_negative",
    dedupeKey: `cash:${today}`,
    title: "Tu disponible para gastar está en negativo",
    body: `Te faltan ${money(availableCents)} para cubrir tus compromisos próximos.`,
    href: "/",
    payload: { deficitCents: Math.abs(availableCents) },
  };
}

export function shouldNotifyPending(count: number, last: LastNotification | null, today: string): boolean {
  if (count <= 0) return false;
  if (!last) return true;
  const previous = Number(last.payload.count ?? 0);
  if (count > previous) return true;
  return daysBetween(last.createdAt.slice(0, 10), today) >= PENDING_REMINDER_DAYS;
}

export function planPendingNotification(count: number, last: LastNotification | null, today: string): PlannedNotification | null {
  if (!shouldNotifyPending(count, last, today)) return null;
  return {
    kind: "pending_decisions",
    dedupeKey: `pending:${today}`,
    title: count === 1 ? "Tienes 1 cosa por decidir" : `Tienes ${count} cosas por decidir`,
    body: "Hay movimientos o recurrentes que necesitan tu confirmación.",
    href: "/",
    payload: { count },
  };
}

export function planNotifications(input: NotificationInput): PlannedNotification[] {
  const planned: PlannedNotification[] = [
    ...planPaymentNotifications(input.entries, input.today),
    ...planBudgetNotifications(input.budgetLines, input.periodStart),
  ];
  const cash = planCashNotification(input.availableCents, input.lastCash, input.today);
  if (cash) planned.push(cash);
  const pending = planPendingNotification(input.pendingDecisions, input.lastPending, input.today);
  if (pending) planned.push(pending);
  return planned;
}

export function retentionCutoff(today: string): string {
  return addDays(today, -RETENTION_DAYS);
}

const TELEGRAM_EMOJI: Record<NotificationKind, string> = {
  payment_due: "🗓",
  payment_late: "⏰",
  budget_warning: "📊",
  budget_exceeded: "🚨",
  cash_negative: "📉",
  pending_decisions: "📝",
  statement_ready: "🏦",
};

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function telegramHtml(notification: Pick<PlannedNotification, "kind" | "title" | "body">): string {
  return `${TELEGRAM_EMOJI[notification.kind]} <b>${escapeHtml(notification.title)}</b>\n${escapeHtml(notification.body)}`;
}
