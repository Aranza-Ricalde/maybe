import Link from "next/link";
import { EmptyState } from "@/components/molecules/EmptyState";
import { ROUTES } from "@/domain/shared/routes";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <EmptyState title="No encontramos esa página" description="Puede que el enlace haya cambiado." action={<Link href={ROUTES.dashboard} className="text-sm text-primary hover:underline">Ir al inicio →</Link>} />
    </main>
  );
}
