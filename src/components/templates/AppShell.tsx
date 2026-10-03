import type { ReactNode } from "react";
import { AppSidebar } from "@/components/organisms/AppSidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto bg-background p-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}
