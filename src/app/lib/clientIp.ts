import "server-only";
import type { NextRequest } from "next/server";

const UNKNOWN_IP = "desconocida";

export function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || UNKNOWN_IP;
}
