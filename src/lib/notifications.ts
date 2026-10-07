export type NotificationStatus = "default" | "accent" | "success" | "warning" | "danger";

export interface NotificationItem {
  id: string;
  status: NotificationStatus;
  title: string;
  description?: string;
  durationMs: number;
}

export interface NotificationInput {
  status?: NotificationStatus;
  title: string;
  description?: string;
  durationMs?: number;
}

export const MAX_VISIBLE_NOTIFICATIONS = 4;

export const DEFAULT_DURATION_MS: Record<NotificationStatus, number> = { default: 3500, accent: 3500, success: 3000, warning: 5000, danger: 6000 };

const EMPTY: NotificationItem[] = [];
let items: NotificationItem[] = EMPTY;
let counter = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export function subscribeNotifications(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getNotifications = (): NotificationItem[] => items;
export const getServerNotifications = (): NotificationItem[] => EMPTY;

export function dismissNotification(id: string): void {
  items = items.filter((item) => item.id !== id);
  emit();
}

export function pushNotification({ status = "default", title, description, durationMs }: NotificationInput): string {
  const id = `n${++counter}`;
  const next: NotificationItem = { id, status, title, description, durationMs: durationMs ?? DEFAULT_DURATION_MS[status] };
  items = [...items, next].slice(-MAX_VISIBLE_NOTIFICATIONS);
  emit();
  return id;
}

type Shortcut = (title: string, description?: string, durationMs?: number) => string;
const shortcut = (status: NotificationStatus): Shortcut => (title, description, durationMs) => pushNotification({ status, title, description, durationMs });

export const notify = { info: shortcut("accent"), success: shortcut("success"), warning: shortcut("warning"), error: shortcut("danger") };

export function resetNotifications(): void {
  items = EMPTY;
  counter = 0;
  emit();
}
