"use client";

import { Button } from "@/components/ui/button";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { PUSH_AVAILABILITY_TEXT } from "@/lib/presenters/push";

export function PushDeviceCard({ publicKey }: { publicKey: string | null }) {
  const { availability, busy, error, enable, disable, sendTest } = usePushSubscription(publicKey);

  return (
    <div className="flex flex-col gap-3" aria-label="Notificaciones en este dispositivo">
      <p className="text-sm text-muted-foreground">{PUSH_AVAILABILITY_TEXT[availability]}</p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {availability === "ready" && (
          <Button type="button" disabled={busy} onClick={enable}>
            Activar en este dispositivo
          </Button>
        )}
        {availability === "subscribed" && (
          <>
            <Button type="button" variant="outline" disabled={busy} onClick={sendTest}>
              Enviar notificación de prueba
            </Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={disable}>
              Desactivar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
