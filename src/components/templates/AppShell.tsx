import type { ReactNode } from "react";
import { AppSidebar } from "@/components/organisms/AppSidebar";
import { BottomNav } from "@/components/organisms/BottomNav";
import { ImportProgressPanel } from "@/components/organisms/ImportProgressPanel";
import { StatementImportProvider } from "@/providers/StatementImportProvider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

export function AppShell({ children, defaultSidebarOpen }: { children: ReactNode; defaultSidebarOpen: boolean }) {
  return (
    <StatementImportProvider>
      <SidebarProvider defaultOpen={defaultSidebarOpen} className="h-dvh min-h-0">
        <AppSidebar />
        <SidebarInset className="min-w-0 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">{children}</div>
        </SidebarInset>
        <BottomNav />
        <ImportProgressPanel />
        <Toaster position="top-left" richColors closeButton />
      </SidebarProvider>
    </StatementImportProvider>
  );
}
