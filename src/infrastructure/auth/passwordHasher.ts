import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { PasswordHasher } from "@/domain/auth/ports";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    const salt = randomBytes(16);
    const derived = (await scryptAsync(plain, salt, KEY_LENGTH)) as Buffer;
    return `${salt.toString("hex")}:${derived.toString("hex")}`;
  }

  async verify(plain: string, stored: string): Promise<boolean> {
    const [saltHex, hashHex] = stored.split(":");
    if (!saltHex || !hashHex) return false;

    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derived = (await scryptAsync(plain, salt, expected.length)) as Buffer;

    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  }
}
