import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { InvalidLoginError } from "@/application/login";
import { loginUseCase } from "@/infrastructure/container";
import { setAuthCookies } from "@/app/lib/session";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    const { accessToken, refreshToken, refreshExpiresAt } = await loginUseCase.execute(email, password);
    await setAuthCookies(accessToken, refreshToken, refreshExpiresAt);
  } catch (err) {
    if (err instanceof InvalidLoginError) {
      redirect("/login?error=1");
    }
    throw err;
  }

  redirect("/");
}
