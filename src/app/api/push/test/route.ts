import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/dal";
import { notificationChannel } from "@/infrastructure/container";
import { logFailure } from "@/lib/log";

export async function POST(): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "no_autenticado" }, { status: 401 });
  try {
    await notificationChannel.deliver(user.familyId, { kind: "pending_decisions", title: "Notificación de prueba", body: "Si ves esto, los avisos de Maybe llegan a este dispositivo.", href: "/", tag: "prueba" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logFailure("falló la notificación de prueba", error);
    return NextResponse.json({ ok: false, error: "no_enviado" }, { status: 500 });
  }
}
