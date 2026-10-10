import { SignJWT, importJWK } from "jose";
import type { PushPayload, PushSender, PushSubscriptionRecord, PushSendResult } from "@/domain/notifications/ports";
import { decodeBase64Url, encryptPushPayload } from "./webPushCrypto";

const REQUEST_TIMEOUT_MS = 8000;
const VAPID_TTL_SECONDS = 12 * 60 * 60;
const MESSAGE_TTL_SECONDS = 24 * 60 * 60;
const GONE_STATUSES = new Set([404, 410]);

export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export function loadVapidConfig(env: NodeJS.ProcessEnv = process.env): VapidConfig | null {
  const { VAPID_PUBLIC_KEY: publicKey, VAPID_PRIVATE_KEY: privateKey, VAPID_SUBJECT: subject } = env;
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject: subject || "mailto:admin@example.com" };
}

export class WebPushSender implements PushSender {
  constructor(private readonly config: VapidConfig) {}

  async send(subscription: PushSubscriptionRecord, payload: PushPayload): Promise<PushSendResult> {
    const body = encryptPushPayload({
      payload: Buffer.from(JSON.stringify(payload)),
      userPublicKey: decodeBase64Url(subscription.p256dh),
      authSecret: decodeBase64Url(subscription.auth),
    });

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: await this.authorization(subscription.endpoint),
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: String(MESSAGE_TTL_SECONDS),
        Urgency: "normal",
      },
      body: new Uint8Array(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.ok) return "sent";
    if (GONE_STATUSES.has(response.status)) return "gone";
    throw new Error(`El servicio de push respondió ${response.status}`);
  }

  private async authorization(endpoint: string): Promise<string> {
    const publicKey = decodeBase64Url(this.config.publicKey);
    const key = await importJWK(
      { kty: "EC", crv: "P-256", x: publicKey.subarray(1, 33).toString("base64url"), y: publicKey.subarray(33, 65).toString("base64url"), d: this.config.privateKey },
      "ES256",
    );
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", typ: "JWT" })
      .setAudience(new URL(endpoint).origin)
      .setSubject(this.config.subject)
      .setExpirationTime(Math.floor(Date.now() / 1000) + VAPID_TTL_SECONDS)
      .sign(key);
    return `vapid t=${token}, k=${this.config.publicKey}`;
  }
}
