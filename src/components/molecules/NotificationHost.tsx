"use client";

import { useCallback, useSyncExternalStore } from "react";
import { dismissNotification, getNotifications, getServerNotifications, subscribeNotifications } from "@/lib/notifications";
import { NotificationToast } from "./NotificationToast";

export function NotificationHost() {
  const items = useSyncExternalStore(subscribeNotifications, getNotifications, getServerNotifications);
  const dismiss = useCallback((id: string) => dismissNotification(id), []);
  if (items.length === 0) return null;
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 top-4 z-[60] flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {items.map((item) => (
        <NotificationToast key={item.id} item={item} onDismiss={dismiss} />
      ))}
    </div>
  );
}
