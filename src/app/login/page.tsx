import { Button, Card, FieldError, Input, Label, TextField } from "@heroui/react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/dal";
import { LOGIN_ERRORS, ROUTES, type LoginSearchParams } from "@/domain/shared/routes";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  const { error } = await searchParams;

  const user = await getCurrentUser();
  if (user) redirect(ROUTES.dashboard);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-lg font-bold text-accent-foreground">
            M
          </span>
          <h1 className="text-xl font-semibold">Maybe</h1>
          <p className="text-sm text-muted">Entra a tus finanzas</p>
        </div>

        <form method="POST" action={ROUTES.apiLogin} className="flex flex-col gap-4">
          <TextField name="email" type="email" isRequired autoFocus className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium text-foreground">Email</Label>
            <Input />
            <FieldError className="text-xs text-danger" />
          </TextField>

          <TextField name="password" type="password" isRequired className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium text-foreground">Contraseña</Label>
            <Input />
            <FieldError className="text-xs text-danger" />
          </TextField>

          {error && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground">
              {error === LOGIN_ERRORS.locked ? "Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo." : "Email o contraseña incorrectos."}
            </p>
          )}

          <Button type="submit" variant="primary" fullWidth className="mt-1">
            Entrar
          </Button>
        </form>
      </Card>
    </main>
  );
}
