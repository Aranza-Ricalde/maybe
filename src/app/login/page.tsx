import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/dal";
import { CircleAlert } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="justify-items-center text-center">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">M</span>
          <CardTitle className="text-xl">Maybe</CardTitle>
          <CardDescription>Entra a tus finanzas</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="POST" action={ROUTES.apiLogin}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" name="email" type="email" required autoFocus autoComplete="email" />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <Input id="password" name="password" type="password" required autoComplete="current-password" />
              </Field>
              {error && (
                <Alert variant="destructive">
                  <CircleAlert />
                  <AlertTitle>{error === LOGIN_ERRORS.locked ? "Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo." : "Email o contraseña incorrectos."}</AlertTitle>
                </Alert>
              )}
              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
