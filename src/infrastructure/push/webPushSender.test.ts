import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { decodeBase64Url, generateServerKeys } from "./webPushCrypto";
import { WebPushSender, loadVapidConfig } from "./webPushSender";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function subscription() {
  const keys = generateServerKeys();
  return { endpoint: "https://push.example.com/send/abc", p256dh: keys.publicKey.toString("base64url"), auth: "BTBZMqHH6r4Tts7J_aSIgg" };
}

function vapid() {
  const keys = generateServerKeys();
  return { publicKey: keys.publicKey.toString("base64url"), privateKey: keys.privateKey.toString("base64url"), subject: "mailto:a@b.mx" };
}

test("envía el mensaje cifrado con cabeceras VAPID y aes128gcm", async () => {
  let captured: { url: string; headers: Record<string, string>; body: Uint8Array } | null = null;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    captured = { url, headers: init.headers as Record<string, string>, body: init.body as Uint8Array };
    return new Response(null, { status: 201 });
  }) as typeof fetch;

  const config = vapid();
  const result = await new WebPushSender(config).send(subscription(), { title: "Hola", body: "Mundo", url: "/", tag: "t" });

  assert.equal(result, "sent");
  assert.ok(captured);
  const request = captured as { url: string; headers: Record<string, string>; body: Uint8Array };
  assert.equal(request.url, "https://push.example.com/send/abc");
  assert.equal(request.headers["Content-Encoding"], "aes128gcm");
  assert.match(request.headers.Authorization, new RegExp(`^vapid t=[\\w-]+\\.[\\w-]+\\.[\\w-]+, k=${config.publicKey}$`));
  assert.equal(request.body[20], 65);
});

test("un endpoint caducado (404 o 410) se reporta como gone y otros errores lanzan", async () => {
  globalThis.fetch = (async () => new Response(null, { status: 410 })) as typeof fetch;
  const sender = new WebPushSender(vapid());
  assert.equal(await sender.send(subscription(), { title: "a", body: "b", url: "/", tag: "t" }), "gone");
  globalThis.fetch = (async () => new Response(null, { status: 500 })) as typeof fetch;
  await assert.rejects(() => sender.send(subscription(), { title: "a", body: "b", url: "/", tag: "t" }));
});

test("sin llaves VAPID no hay configuración", () => {
  assert.equal(loadVapidConfig({} as NodeJS.ProcessEnv), null);
  const loaded = loadVapidConfig({ VAPID_PUBLIC_KEY: "a", VAPID_PRIVATE_KEY: "b" } as unknown as NodeJS.ProcessEnv);
  assert.equal(loaded?.subject, "mailto:admin@example.com");
  assert.equal(decodeBase64Url("AQID").length, 3);
});
