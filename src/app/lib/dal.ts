import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { AuthenticatedUser } from "@/domain/auth/ports";
import { validateAccessTokenUseCase } from "@/infrastructure/container";
import { getAccessToken } from "./session";

export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const token = await getAccessToken();
  return validateAccessTokenUseCase.execute(token);
});

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
