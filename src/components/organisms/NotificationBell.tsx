"use client";

import { Bell, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/molecules/EmptyState";
import { ResponsiveDialog } from "@/components/molecules/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import type { StoredNotification } from "@/domain/notifications/ports";
import { notificationAge, notificationPresentation, unreadBadge, type NotificationTone } from "@/lib/presenters/notifications";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/providers/NotificationsProvider";

const DOT: Record<NotificationTone, string> = { warning: "bg-warning", danger: "bg-danger", primary: "bg-primary" };

interface NotificationItemProps {
  item: StoredNotification;
  now: Date;
  onOpen: () => void;
  onDismiss: () => void;
}

function NotificationItem({ item, now, onOpen, onDismiss }: NotificationItemProps) {
  const { tone } = notificationPresentation(item.kind);
  return (
    <li className="flex items-start gap-3 py-3">
      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", DOT[tone])} aria-hidden />
      <Link href={item.href} onClick={onOpen} className="min-w-0 flex-1">
        <p className="text-sm leading-snug font-medium">{item.title}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{item.body}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{notificationAge(item.createdAt, now)}</p>
      </Link>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Eliminar: ${item.title}`} onClick={onDismiss} className="-mr-2 shrink-0 text-muted-foreground">
        <X />
      </Button>
    </li>
  );
}

export function NotificationBell({ className }: { className?: string }) {
  const { items, unreadCount, markRead, dismiss, markAllRead, dismissAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const [now] = useState(() => new Date());
  const badge = unreadBadge(unreadCount);

  return (
    <ResponsiveDialog
      title="Notificaciones"
      open={open}
      onOpenChange={setOpen}
      size="sm"
      trigger={
        <Button type="button" variant="ghost" size="icon-sm" aria-label={badge ? `Notificaciones, ${unreadCount} sin leer` : "Notificaciones"} className={cn("relative", className)}>
          <Bell />
          {badge && <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 font-semibold text-primary-foreground">{badge}</span>}
        </Button>
      }
    >
      {items.length === 0 ? (
        <EmptyState title="Estás al día" description="No tienes notificaciones pendientes." />
      ) : (
        <>
          <ul aria-label="Notificaciones" className="flex flex-col divide-y">
            {items.map((item) => (
              <NotificationItem
                key={item.id}
                item={item}
                now={now}
                onOpen={() => {
                  markRead(item.id);
                  setOpen(false);
                }}
                onDismiss={() => dismiss(item.id)}
              />
            ))}
          </ul>
          <div className="flex items-center justify-between border-t pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={markAllRead}>
              Marcar todas como leídas
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={dismissAll}>
              Eliminar todas
            </Button>
          </div>
        </>
      )}
    </ResponsiveDialog>
  );
}
