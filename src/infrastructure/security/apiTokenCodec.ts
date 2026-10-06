import { createHash, randomBytes } from "node:crypto";
import type { ApiTokenCodec, GeneratedApiToken } from "@/domain/captures/ports";
import { API_TOKEN_BYTES, API_TOKEN_PREFIX } from "@/domain/captures/rules";

const LAST_CHARS = 4;

export class Sha256ApiTokenCodec implements ApiTokenCodec {
  generate(): GeneratedApiToken {
    const token = `${API_TOKEN_PREFIX}${randomBytes(API_TOKEN_BYTES).toString("base64url")}`;
    return { token, tokenHash: this.hash(token), lastFour: token.slice(-LAST_CHARS) };
  }

  hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
