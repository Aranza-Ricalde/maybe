"use client";

import { Button, Card } from "@heroui/react";
import { useActionState } from "react";
import { Chip } from "@/components/atoms/Chip";
import { Text } from "@/components/atoms/Text";
import { CAPTURE_API_ROUTE } from "@/domain/captures/rules";
import { formatShortDate } from "@/lib/format";

export interface ApiTokenView {
  lastFour: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ApiTokenState {
  token: string | null;
}

export interface ApiTokenCardProps {
  info: ApiTokenView | null;
  origin: string;
  generateAction: (previous: ApiTokenState, formData: FormData) => Promise<ApiTokenState>;
}

const EXAMPLE_BODY = '{"account":"BBVA","type":"expense","amount":150,"description":"Tacos"}';

export function ApiTokenCard({ info, origin, generateAction }: ApiTokenCardProps) {
  const [state, formAction, pending] = useActionState(generateAction, { token: null });
  const url = `${origin}${CAPTURE_API_ROUTE}`;

  return (
    <Card className="p-5">
      <Card.Header className="flex-row! items-center justify-between">
        <Card.Title>Registrar desde el teléfono</Card.Title>
        {info ? <Chip tone="success">Activo · termina en {info.lastFour}</Chip> : <Chip tone="muted">Sin token</Chip>}
      </Card.Header>
      <Card.Content className="flex flex-col gap-3 text-sm">
        <Text>
          Crea un token y úsalo en un atajo de tu teléfono (Atajos de iPhone, Tasker, MacroDroid) para mandar movimientos. El sistema detecta comercio y categoría; si tiene dudas te lo pregunta en Movimientos.
        </Text>

        {state.token && (
          <div role="status" className="rounded-lg border border-separator bg-surface p-3">
            <p className="font-medium text-foreground">Copia tu token ahora: no se vuelve a mostrar.</p>
            <code className="mt-1 block break-all rounded bg-separator px-2 py-1 text-xs">{state.token}</code>
          </div>
        )}

        {info && (
          <p className="text-muted">
            Creado el {formatShortDate(info.createdAt.slice(0, 10))} · {info.lastUsedAt ? `último uso el ${formatShortDate(info.lastUsedAt.slice(0, 10))}` : "sin usar todavía"}
          </p>
        )}

        <form action={formAction}>
          <Button type="submit" size="sm" variant={info ? "ghost" : "primary"} isDisabled={pending}>
            {pending ? "…" : info ? "Generar uno nuevo (el anterior deja de servir)" : "Generar token"}
          </Button>
        </form>

        <div className="space-y-1 text-xs text-muted">
          <p>
            <span className="font-medium text-foreground">POST</span> <code className="rounded bg-separator px-1 py-0.5">{url}</code>
          </p>
          <p>
            Encabezados: <code className="rounded bg-separator px-1 py-0.5">Authorization: Bearer &lt;token&gt;</code> y <code className="rounded bg-separator px-1 py-0.5">Content-Type: application/json</code>
          </p>
          <p>
            Cuerpo: <code className="rounded bg-separator px-1 py-0.5">{EXAMPLE_BODY}</code>
          </p>
          <p>
            Obligatorios: <code>account</code> (nombre exacto de la cuenta), <code>type</code> (<code>expense</code> o <code>income</code>), <code>amount</code> y <code>description</code>. Opcionales: <code>date</code> (AAAA-MM-DD, por defecto hoy) y <code>notes</code>.
          </p>
        </div>
      </Card.Content>
    </Card>
  );
}
