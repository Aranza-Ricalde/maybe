import type { ReactNode } from "react";
import { AppHeader } from "@/components/organisms/AppHeader";
import { AppSidebar } from "@/components/organisms/AppSidebar";
import { BottomNav } from "@/components/organisms/BottomNav";
import { ImportProgressPanel } from "@/components/organisms/ImportProgressPanel";
import type { NavUserProps } from "@/components/organisms/NavUser";
import { StatementImportProvider } from "@/providers/StatementImportProvider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

export function AppShell({ children, defaultSidebarOpen, user }: { children: ReactNode; defaultSidebarOpen: boolean; user: NavUserProps }) {
  return (
    <StatementImportProvider>
      <SidebarProvider defaultOpen={defaultSidebarOpen} className="h-dvh min-h-0">
        <AppSidebar user={user} />
        <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
          <AppHeader />
          <div className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">{children}</div>
          </div>
        </SidebarInset>
        <BottomNav />
        <ImportProgressPanel />
        <Toaster position="top-left" richColors closeButton />
      </SidebarProvider>
    </StatementImportProvider>
  );
}
