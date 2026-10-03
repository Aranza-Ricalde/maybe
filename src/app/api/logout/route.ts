import { redirect } from "next/navigation";
import { logoutUseCase } from "@/infrastructure/container";
import { clearAuthCookies, getRefreshToken } from "@/app/lib/session";

export async function POST() {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    await logoutUseCase.execute(refreshToken);
  }
  await clearAuthCookies();
  redirect("/login");
}
