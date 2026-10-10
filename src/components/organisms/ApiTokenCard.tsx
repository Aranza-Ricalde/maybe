"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import { MobileCollapsible } from "@/components/molecules/MobileCollapsible";
import { Text } from "@/components/atoms/Text";
import type { ActionResult } from "@/lib/actionResult";
import { reportResult } from "@/services/actionFeedback";
import { CAPTURE_API_ROUTE } from "@/domain/captures/rules";
import { formatShortDate } from "@/lib/format";

export interface ApiTokenView {
  lastFour: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ApiTokenState {
  token: string | null;
  result?: ActionResult;
}

export interface ApiTokenCardProps {
  info: ApiTokenView | null;
  origin: string;
  generateAction: (previous: ApiTokenState, formData: FormData) => Promise<ApiTokenState>;
}

const EXAMPLE_BODY = '{"account":"BBVA","type":"expense","amount":150,"description":"Tacos"}';
const EXAMPLE_MESSAGE_BODY = '{"message":"Compra con CUENTA en REST TACOS $150.00 06 octubre 12:44h"}';

export function ApiTokenCard({ info, origin, generateAction }: ApiTokenCardProps) {
  const [state, formAction, pending] = useActionState(async (previous: ApiTokenState, formData: FormData) => {
    const next = await generateAction(previous, formData);
    reportResult(next.result);
    return next;
  }, { token: null });
  const url = `${origin}${CAPTURE_API_ROUTE}`;

  return (
    <Card>
      <CardHeader className="items-center justify-between gap-2">
        <CardTitle>Registrar desde el teléfono</CardTitle>
        {info ? <Badge variant="success">Activo · termina en {info.lastFour}</Badge> : <Badge variant="secondary">Sin token</Badge>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <Text>
          Crea un token y úsalo en un atajo de tu teléfono (Atajos de iPhone, Tasker, MacroDroid) para mandar movimientos. El sistema detecta comercio y categoría; si tiene dudas te lo pregunta en Movimientos.
        </Text>

        {state.token && (
          <div role="status" className="rounded-lg border border-border bg-card p-3">
            <p className="font-medium text-foreground">Copia tu token ahora: no se vuelve a mostrar.</p>
            <code className="mt-1 block break-all rounded bg-muted px-2 py-1 text-xs">{state.token}</code>
          </div>
        )}

        {info && (
          <p className="text-muted-foreground">
            Creado el {formatShortDate(info.createdAt.slice(0, 10))} · {info.lastUsedAt ? `último uso el ${formatShortDate(info.lastUsedAt.slice(0, 10))}` : "sin usar todavía"}
          </p>
        )}

        <form action={formAction}>
          <Button type="submit" size="sm" variant={info ? "outline" : "default"} disabled={pending} className="max-md:h-auto max-md:w-full max-md:whitespace-normal max-md:py-2">
            {pending ? "…" : info ? "Generar uno nuevo (el anterior deja de servir)" : "Generar token"}
          </Button>
        </form>

        <MobileCollapsible title="Cómo conectarlo">
        <div className="space-y-1 text-xs text-muted-foreground [&_code]:break-all">
          <p>
            <span className="font-medium text-foreground">POST</span> <code className="rounded bg-muted px-1 py-0.5">{url}</code>
          </p>
          <p>
            Encabezados: <code className="rounded bg-muted px-1 py-0.5">Authorization: Bearer &lt;token&gt;</code> y <code className="rounded bg-muted px-1 py-0.5">Content-Type: application/json</code>
          </p>
          <p className="pt-1 font-medium text-foreground">Forma 1 · JSON estructurado</p>
          <p>
            Cuerpo: <code className="rounded bg-muted px-1 py-0.5">{EXAMPLE_BODY}</code>
          </p>
          <p>
            Obligatorios: <code>account</code> (nombre exacto de la cuenta), <code>type</code> (<code>expense</code> o <code>income</code>), <code>amount</code> y <code>description</code>. Opcionales: <code>date</code> (AAAA-MM-DD, por defecto hoy) y <code>notes</code>.
          </p>
          <p className="pt-1 font-medium text-foreground">Forma 2 · Mensaje de texto</p>
          <p>
            Encabezado extra: <code className="rounded bg-muted px-1 py-0.5">X-Account: Nu Débito</code> (nombre exacto de la cuenta)
          </p>
          <p>
            Cuerpo: <code className="rounded bg-muted px-1 py-0.5">{EXAMPLE_MESSAGE_BODY}</code>
          </p>
          <p>
            Solo lleva <code>message</code>: el texto de la notificación del banco, tal cual. El sistema detecta monto, comercio y fecha.
          </p>
        </div>
        </MobileCollapsible>
      </CardContent>
    </Card>
  );
}
