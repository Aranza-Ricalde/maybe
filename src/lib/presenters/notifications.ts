import type { NotificationKind } from "@/domain/notifications/rules";

export type NotificationTone = "warning" | "danger" | "primary";

const TONE: Record<NotificationKind, NotificationTone> = {
  payment_due: "warning",
  payment_late: "danger",
  budget_warning: "warning",
  budget_exceeded: "danger",
  cash_negative: "danger",
  pending_decisions: "primary",
  statement_ready: "primary",
};

export function notificationPresentation(kind: NotificationKind): { tone: NotificationTone } {
  return { tone: TONE[kind] };
}

export function notificationAge(createdAtIso: string, now: Date): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - Date.parse(createdAtIso)) / 60_000));
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Ayer" : `Hace ${days} días`;
}

export function unreadBadge(count: number): string | null {
  if (count <= 0) return null;
  return count > 9 ? "9+" : String(count);
}
