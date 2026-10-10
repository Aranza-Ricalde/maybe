import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateNotificationsUseCase } from "@/infrastructure/container";
import { logFailure } from "@/lib/log";
import { todayIso } from "@/lib/today";

export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const result = await generateNotificationsUseCase.execute(todayIso());
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    logFailure("falló la generación de notificaciones", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
