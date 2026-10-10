import type { ReactNode } from "react";
import { AppHeader } from "@/components/organisms/AppHeader";
import { AppSidebar } from "@/components/organisms/AppSidebar";
import { FloatingActionButton } from "@/components/molecules/FloatingActionButton";
import { BottomNav } from "@/components/organisms/BottomNav";
import { ROUTES, newTransactionHref } from "@/domain/shared/routes";
import { ImportProgressPanel } from "@/components/organisms/ImportProgressPanel";
import type { NavUserProps } from "@/components/organisms/NavUser";
import { NotificationsProvider, type NotificationsProviderProps } from "@/providers/NotificationsProvider";
import { StatementImportProvider } from "@/providers/StatementImportProvider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

export interface AppShellProps {
  children: ReactNode;
  defaultSidebarOpen: boolean;
  user: NavUserProps;
  notifications: Omit<NotificationsProviderProps, "children">;
}

export function AppShell({ children, defaultSidebarOpen, user, notifications }: AppShellProps) {
  return (
    <NotificationsProvider {...notifications}>
    <StatementImportProvider>
      <SidebarProvider defaultOpen={defaultSidebarOpen} className="h-dvh min-h-0">
        <AppSidebar user={user} />
        <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
          <AppHeader />
          <div className="flex-1 overflow-y-auto p-3 pb-24 md:p-6 md:pb-6">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 md:gap-6">{children}</div>
          </div>
        </SidebarInset>
        <FloatingActionButton href={newTransactionHref()} label="Registrar movimiento" hiddenOn={[ROUTES.import]} />
        <BottomNav />
        <ImportProgressPanel />
        <Toaster position="top-left" richColors closeButton />
      </SidebarProvider>
    </StatementImportProvider>
    </NotificationsProvider>
  );
}
