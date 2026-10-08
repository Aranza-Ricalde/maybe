import type { ReactNode } from "react";
import { ROUTES } from "@/domain/shared/routes";

export function LogoutForm({ children }: { children: ReactNode }) {
  return (
    <form method="POST" action={ROUTES.apiLogout}>
      {children}
    </form>
  );
}
