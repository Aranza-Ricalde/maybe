export type NotificationKind = "info" | "success" | "warning" | "error";

export const NOTIFICATION_DURATION_MS: Record<NotificationKind, number> = { info: 3500, success: 3000, warning: 5000, error: 6000 };

export interface NotificationOptions {
  description?: string;
  duration: number;
}

export function notificationOptions(kind: NotificationKind, description?: string, durationMs?: number): NotificationOptions {
  return { description, duration: durationMs ?? NOTIFICATION_DURATION_MS[kind] };
}
