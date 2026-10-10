"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition, type ReactNode } from "react";
import type { StoredNotification } from "@/domain/notifications/ports";
import type { ActionResult } from "@/lib/actionResult";
import { reportResult } from "@/services/actionFeedback";

export interface NotificationsActions {
  markRead: (formData: FormData) => Promise<ActionResult>;
  dismiss: (formData: FormData) => Promise<ActionResult>;
  markAllRead: () => Promise<ActionResult>;
  dismissAll: () => Promise<ActionResult>;
}

interface NotificationsContextValue {
  items: StoredNotification[];
  unreadCount: number;
  isPending: boolean;
  markRead: (id: number) => void;
  dismiss: (id: number) => void;
  markAllRead: () => void;
  dismissAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export interface NotificationsProviderProps {
  items: StoredNotification[];
  unreadCount: number;
  actions: NotificationsActions;
  children: ReactNode;
}

const idData = (id: number) => {
  const data = new FormData();
  data.set("id", String(id));
  return data;
};

export function NotificationsProvider({ items, unreadCount, actions, children }: NotificationsProviderProps) {
  const [hidden, setHidden] = useState<ReadonlySet<number>>(new Set());
  const [allHidden, setAllHidden] = useState(false);
  const [isPending, startTransition] = useTransition();

  const run = useCallback((task: () => Promise<ActionResult>) => startTransition(async () => {
        reportResult(await task());
      }), []);

  const value = useMemo<NotificationsContextValue>(() => {
    const visible = allHidden ? [] : items.filter((item) => !hidden.has(item.id));
    const hide = (id: number) => setHidden((current) => new Set(current).add(id));
    return {
      items: visible,
      unreadCount: allHidden ? 0 : Math.max(0, unreadCount - (items.length - visible.length)),
      isPending,
      markRead: (id) => {
        hide(id);
        run(() => actions.markRead(idData(id)));
      },
      dismiss: (id) => {
        hide(id);
        run(() => actions.dismiss(idData(id)));
      },
      markAllRead: () => {
        setAllHidden(true);
        run(() => actions.markAllRead());
      },
      dismissAll: () => {
        setAllHidden(true);
        run(() => actions.dismissAll());
      },
    };
  }, [actions, allHidden, hidden, isPending, items, run, unreadCount]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications requiere NotificationsProvider");
  return context;
}
