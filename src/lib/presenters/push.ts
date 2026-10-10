export type PushAvailability = "unsupported" | "needs-install" | "not-configured" | "denied" | "ready" | "subscribed";

export interface PushEnvironment {
  supported: boolean;
  isIos: boolean;
  isStandalone: boolean;
  hasPublicKey: boolean;
  permission: "default" | "granted" | "denied";
  subscribed: boolean;
}

export function pushAvailability(environment: PushEnvironment): PushAvailability {
  if (!environment.hasPublicKey) return "not-configured";
  if (environment.isIos && !environment.isStandalone) return "needs-install";
  if (!environment.supported) return "unsupported";
  if (environment.permission === "denied") return "denied";
  if (environment.permission === "granted" && environment.subscribed) return "subscribed";
  return "ready";
}

export const PUSH_AVAILABILITY_TEXT: Record<PushAvailability, string> = {
  unsupported: "Este navegador no permite notificaciones push.",
  "needs-install": "En iPhone primero agrega Maybe a tu pantalla de inicio (Compartir → Agregar a inicio) y ábrela desde ahí.",
  "not-configured": "Las notificaciones push aún no están configuradas en el servidor.",
  denied: "Bloqueaste las notificaciones. Actívalas desde los ajustes del dispositivo para esta app.",
  ready: "Recibe tus avisos de pagos y presupuestos como notificaciones en este dispositivo.",
  subscribed: "Este dispositivo recibe tus avisos.",
};

export function urlBase64ToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const raw = atob(padded);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}
