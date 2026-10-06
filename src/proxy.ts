import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ACCESS_TOKEN_TTL_SECONDS } from "@/domain/auth/rules";
import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from "@/app/lib/constants";
import { JoseAccessTokenIssuer, loadAuthSecret } from "@/infrastructure/auth/accessTokens";
import { CryptoSessionTokens } from "@/infrastructure/auth/sessionTokens";
import { findSessionWithUserByTokenHashEdge } from "@/infrastructure/db/edgeSessionLookup";
import { ROUTES } from "@/domain/shared/routes";

const PUBLIC_PATHS = new Set<string>([ROUTES.login]);
const sessionTokens = new CryptoSessionTokens();

async function hasValidAccessToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, loadAuthSecret());
    return true;
  } catch {
    return false;
  }
}

async function rotateAccessToken(refreshToken: string): Promise<string | null> {
  const tokenHash = await sessionTokens.hash(refreshToken);
  const session = await findSessionWithUserByTokenHashEdge(tokenHash);
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;

  const issuer = new JoseAccessTokenIssuer(loadAuthSecret());
  return issuer.sign(session.user);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  if (await hasValidAccessToken(accessToken)) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return NextResponse.redirect(new URL(ROUTES.login, request.url));
  }

  const newAccessToken = await rotateAccessToken(refreshToken);
  if (!newAccessToken) {
    return NextResponse.redirect(new URL(ROUTES.login, request.url));
  }

  request.cookies.set(ACCESS_TOKEN_COOKIE_NAME, newAccessToken);
  const response = NextResponse.next({ request });
  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
    path: "/",
  });
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
