import { createHmac, timingSafeEqual } from "node:crypto";
import type { TelegramLinkCodes } from "@/domain/telegram/ports";

const CODE_LENGTH = 10;

export class HmacTelegramLinkCodes implements TelegramLinkCodes {
  constructor(private readonly secretProvider: () => string = requireSecret) {}

  codeFor(userId: number): string {
    return createHmac("sha256", this.secretProvider()).update(`telegram-link:${userId}`).digest("hex").slice(0, CODE_LENGTH).toUpperCase();
  }

  matches(userId: number, provided: string | null): boolean {
    if (!provided) return false;
    const expected = Buffer.from(this.codeFor(userId));
    const received = Buffer.from(provided.toUpperCase());
    return expected.length === received.length && timingSafeEqual(expected, received);
  }
}

function requireSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET no está definida (ver .env.example)");
  return secret;
}
