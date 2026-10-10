import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/app/lib/dal";
import { pushSubscriptions } from "@/infrastructure/container";

const MAX_BODY_CHARS = 4000;

const subscriptionBody = z.object({
  endpoint: z.url().max(1000).startsWith("https://"),
  keys: z.object({ p256dh: z.string().min(20).max(200), auth: z.string().min(8).max(100) }),
});

const unsubscribeBody = z.object({ endpoint: z.url().max(1000) });

async function readBody(request: NextRequest): Promise<unknown> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "no_autenticado" }, { status: 401 });
  const parsed = subscriptionBody.safeParse(await readBody(request));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "datos_invalidos" }, { status: 400 });
  const { endpoint, keys } = parsed.data;
  await pushSubscriptions.save(user.id, user.familyId, { endpoint, p256dh: keys.p256dh, auth: keys.auth }, request.headers.get("user-agent")?.slice(0, 300) ?? null);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "no_autenticado" }, { status: 401 });
  const parsed = unsubscribeBody.safeParse(await readBody(request));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "datos_invalidos" }, { status: 400 });
  await pushSubscriptions.remove(parsed.data.endpoint);
  return NextResponse.json({ ok: true });
}
