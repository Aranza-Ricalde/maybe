import { randomBytes } from "node:crypto";
import type { SessionTokens } from "@/domain/auth/ports";

export class CryptoSessionTokens implements SessionTokens {
  generate(): string {
    return randomBytes(32).toString("base64url");
  }

  async hash(token: string): Promise<string> {
    const data = new TextEncoder().encode(token);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return Buffer.from(digest).toString("hex");
  }
}
