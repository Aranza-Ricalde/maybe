import "server-only";
import { headers } from "next/headers";

const DEFAULT_PROTOCOL = "https";

export async function requestOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const protocol = requestHeaders.get("x-forwarded-proto") ?? DEFAULT_PROTOCOL;
  return `${protocol}://${requestHeaders.get("host") ?? ""}`;
}
