import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { InvalidLoginError } from "@/application/login";
import { LOGIN_EMAIL_POLICY, LOGIN_IP_POLICY } from "@/domain/auth/attemptLimit";
import { loginAttemptLimiter, loginUseCase } from "@/infrastructure/container";
import { clientIp } from "@/app/lib/clientIp";
import { setAuthCookies } from "@/app/lib/session";
import { LOGIN_ERRORS, ROUTES, loginErrorHref } from "@/domain/shared/routes";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  const password = String(formData.get("password") ?? "").slice(0, 200);

  const ipKey = `ip:${clientIp(request)}`;
  const emailKey = `email:${email}`;
  const [ipDecision, emailDecision] = await Promise.all([loginAttemptLimiter.check(ipKey, LOGIN_IP_POLICY), loginAttemptLimiter.check(emailKey, LOGIN_EMAIL_POLICY)]);
  if (!ipDecision.allowed || !emailDecision.allowed) {
    redirect(loginErrorHref(LOGIN_ERRORS.locked));
  }

  try {
    const { accessToken, refreshToken, refreshExpiresAt } = await loginUseCase.execute(email, password);
    await setAuthCookies(accessToken, refreshToken, refreshExpiresAt);
    await loginAttemptLimiter.reset(emailKey);
  } catch (err) {
    if (err instanceof InvalidLoginError) {
      await Promise.all([loginAttemptLimiter.recordFailure(ipKey, LOGIN_IP_POLICY), loginAttemptLimiter.recordFailure(emailKey, LOGIN_EMAIL_POLICY)]);
      redirect(loginErrorHref(LOGIN_ERRORS.invalidCredentials));
    }
    throw err;
  }

  redirect(ROUTES.dashboard);
}
