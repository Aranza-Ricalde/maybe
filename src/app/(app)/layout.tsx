import type { ReactNode } from "react";
import { requireUser } from "@/app/lib/dal";
import { AppShell } from "@/components/templates/AppShell";

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return <AppShell>{children}</AppShell>;
}
