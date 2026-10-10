import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { requireUser } from "@/app/lib/dal";
import { AppShell } from "@/components/templates/AppShell";
import { notificationInbox } from "@/infrastructure/container";
import { dismissAllNotifications, dismissNotification, markAllNotificationsRead, markNotificationRead } from "./actions";

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const cookieStore = await cookies();
  const inbox = await notificationInbox.view(user.familyId);
  return (
    <AppShell
      defaultSidebarOpen={cookieStore.get("sidebar_state")?.value !== "false"}
      user={{ name: user.name, email: user.email }}
      notifications={{
        items: inbox.items,
        unreadCount: inbox.unreadCount,
        actions: { markRead: markNotificationRead, dismiss: dismissNotification, markAllRead: markAllNotificationsRead, dismissAll: dismissAllNotifications },
      }}
    >
      {children}
    </AppShell>
  );
}
