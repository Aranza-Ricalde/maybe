"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { useIsClient } from "@/hooks/useIsClient";
import { notify } from "@/lib/notifications";

export function EnableNotificationsButton() {
  const isClient = useIsClient();
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  if (!isClient || typeof Notification === "undefined") return null;
  const current = permission ?? Notification.permission;
  if (current !== "default") return null;

  return (
    <Button
      size="sm"
      variant="secondary"
      onPress={async () => {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === "granted") notify.success("Avisos activados", "Te avisaremos cuando termine una importación, aunque estés en otra pestaña.");
      }}
    >
      Activar avisos del navegador
    </Button>
  );
}
