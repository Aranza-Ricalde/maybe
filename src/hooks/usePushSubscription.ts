"use client";

import { useCallback, useEffect, useState } from "react";
import { pushAvailability, urlBase64ToBytes, type PushAvailability } from "@/lib/presenters/push";

const SERVICE_WORKER_URL = "/sw.js";

type StandaloneNavigator = Navigator & { standalone?: boolean };

interface BrowserState {
  supported: boolean;
  isIos: boolean;
  isStandalone: boolean;
  permission: "default" | "granted" | "denied";
  subscribed: boolean;
}

const SERVER_STATE: BrowserState = { supported: false, isIos: false, isStandalone: false, permission: "default", subscribed: false };

async function readBrowserState(): Promise<BrowserState> {
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as StandaloneNavigator).standalone === true;
  if (!supported) return { supported, isIos, isStandalone, permission: "default", subscribed: false };
  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
  const subscription = await registration?.pushManager.getSubscription();
  return { supported, isIos, isStandalone, permission: Notification.permission, subscribed: subscription != null };
}

export function usePushSubscription(publicKey: string | null) {
  const [browser, setBrowser] = useState<BrowserState>(SERVER_STATE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => setBrowser(await readBrowserState()), []);

  useEffect(() => {
    let active = true;
    readBrowserState().then((state) => {
      if (active) setBrowser(state);
    });
    return () => {
      active = false;
    };
  }, []);

  const availability: PushAvailability = pushAvailability({ ...browser, hasPublicKey: publicKey != null });

  const run = useCallback(
    async (task: () => Promise<void>) => {
      setBusy(true);
      setError(null);
      try {
        await task();
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "No se pudo completar la acción");
      } finally {
        await refresh();
        setBusy(false);
      }
    },
    [refresh],
  );

  const enable = useCallback(
    () =>
      run(async () => {
        if (!publicKey) throw new Error("Las notificaciones push no están configuradas");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") throw new Error("No se concedió el permiso de notificaciones");
        const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL);
        await navigator.serviceWorker.ready;
        const subscription =
          (await registration.pushManager.getSubscription()) ??
          (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToBytes(publicKey) as BufferSource }));
        const response = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
        if (!response.ok) throw new Error("No se pudo guardar la suscripción");
      }),
    [publicKey, run],
  );

  const disable = useCallback(
    () =>
      run(async () => {
        const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_URL);
        const subscription = await registration?.pushManager.getSubscription();
        if (!subscription) return;
        await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
        await subscription.unsubscribe();
      }),
    [run],
  );

  const sendTest = useCallback(
    () =>
      run(async () => {
        const response = await fetch("/api/push/test", { method: "POST" });
        if (!response.ok) throw new Error("No se pudo enviar la notificación de prueba");
      }),
    [run],
  );

  return { availability, busy, error, enable, disable, sendTest };
}
