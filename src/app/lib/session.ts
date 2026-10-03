import "server-only";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_TTL_SECONDS } from "@/domain/auth/rules";
import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from "./constants";

const isProduction = process.env.NODE_ENV === "production";

export async function setAuthCookies(accessToken: string, refreshToken: string, refreshExpiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
    path: "/",
  });
  store.set(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    expires: refreshExpiresAt,
    path: "/",
  });
}

export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE_NAME);
  store.delete(REFRESH_TOKEN_COOKIE_NAME);
}
