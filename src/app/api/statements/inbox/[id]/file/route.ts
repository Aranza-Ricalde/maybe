import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/dal";
import { statementInbox } from "@/infrastructure/container";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "no_autenticado" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ ok: false, error: "datos_invalidos" }, { status: 400 });

  const file = await statementInbox.getFile(user.familyId, id);
  if (!file) return NextResponse.json({ ok: false, error: "no_encontrado" }, { status: 404 });
  return new Response(new Uint8Array(file.data), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`, "Cache-Control": "private, no-store" } });
}
