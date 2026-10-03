import { jwtVerify, SignJWT } from "jose";
import type { AccessTokenIssuer, AuthenticatedUser } from "@/domain/auth/ports";
import { ACCESS_TOKEN_TTL_SECONDS } from "@/domain/auth/rules";

export class JoseAccessTokenIssuer implements AccessTokenIssuer {
  constructor(private readonly secret: Uint8Array) {}

  async sign(user: AuthenticatedUser): Promise<string> {
    return new SignJWT({ familyId: user.familyId, email: user.email, name: user.name })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(user.id))
      .setIssuedAt()
      .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
      .sign(this.secret);
  }

  async verify(token: string): Promise<AuthenticatedUser | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret);
      const id = Number(payload.sub);
      const familyId = Number(payload.familyId);
      const email = payload.email;
      const name = payload.name;
      if (!Number.isFinite(id) || !Number.isFinite(familyId) || typeof email !== "string" || typeof name !== "string") {
        return null;
      }
      return { id, familyId, email, name };
    } catch {
      return null;
    }
  }
}

export function loadAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET no está definida (ver .env.example)");
  }
  return new TextEncoder().encode(secret);
}
