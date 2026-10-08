import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { requireUser } from "@/app/lib/dal";
import { AppShell } from "@/components/templates/AppShell";

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  await requireUser();
  const cookieStore = await cookies();
  return <AppShell defaultSidebarOpen={cookieStore.get("sidebar_state")?.value !== "false"}>{children}</AppShell>;
}
