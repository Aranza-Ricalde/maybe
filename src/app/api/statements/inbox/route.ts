import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clientIp } from "@/app/lib/clientIp";
import { API_TOKEN_IP_POLICY } from "@/domain/auth/attemptLimit";
import { CaptureAccountAmbiguousError, CaptureAccountNotFoundError } from "@/domain/captures/rules";
import { InvalidInboxStatementError, MAX_INBOX_STATEMENT_BYTES } from "@/domain/statements/inbox";
import { authenticateApiTokenUseCase, loginAttemptLimiter, receiveStatementUseCase } from "@/infrastructure/container";
import { logFailure } from "@/lib/log";

export const maxDuration = 60;

const BEARER = /^Bearer\s+(\S+)$/i;
const MS_PER_SECOND = 1000;
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;
const MAX_TEXT_FIELD = 300;

const fail = (status: number, error: string, mensaje?: string, headers?: HeadersInit) => NextResponse.json({ ok: false, error, ...(mensaje ? { mensaje } : {}) }, { status, headers });

const text = (form: FormData, key: string): string | null => {
  const value = form.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim().slice(0, MAX_TEXT_FIELD) : null;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ipKey = `api-ip:${clientIp(request)}`;
  const decision = await loginAttemptLimiter.check(ipKey, API_TOKEN_IP_POLICY);
  if (!decision.allowed) return fail(429, "demasiados_intentos", undefined, { "Retry-After": String(Math.ceil(decision.retryAfterMs / MS_PER_SECOND)) });

  const token = request.headers.get("authorization")?.match(BEARER)?.[1];
  const familyId = token ? await authenticateApiTokenUseCase.execute(token) : null;
  if (familyId == null) {
    await loginAttemptLimiter.recordFailure(ipKey, API_TOKEN_IP_POLICY);
    return fail(401, "token_invalido");
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_INBOX_STATEMENT_BYTES + MULTIPART_OVERHEAD_BYTES) return fail(413, "archivo_demasiado_grande", "El PDF pesa más de 4 MB.");
  if (!(request.headers.get("content-type") ?? "").startsWith("multipart/form-data")) return fail(415, "tipo_no_soportado", "Manda el PDF como multipart/form-data.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "datos_invalidos", "No se pudo leer el formulario.");
  }

  const file = form.get("file");
  const bank = text(form, "bank");
  const account = text(form, "account");
  if (!(file instanceof File) || !bank || !account) return fail(400, "datos_invalidos", "Faltan el archivo, el banco o la cuenta.");

  try {
    const result = await receiveStatementUseCase.execute({
      familyId,
      bank,
      accountName: account,
      filename: file.name.slice(0, MAX_TEXT_FIELD) || "estado.pdf",
      data: new Uint8Array(await file.arrayBuffer()),
      fromAddress: text(form, "from"),
      subject: text(form, "subject"),
      receivedAt: text(form, "date"),
    });
    if (result.status === "duplicate") return NextResponse.json({ ok: true, estado: "duplicado" });
    return NextResponse.json({ ok: true, estado: "recibido", id: result.id, cuenta: result.accountName }, { status: 201 });
  } catch (error) {
    if (error instanceof CaptureAccountNotFoundError) return fail(404, "cuenta_no_encontrada", error.message);
    if (error instanceof CaptureAccountAmbiguousError) return fail(409, "cuenta_ambigua", error.message);
    if (error instanceof InvalidInboxStatementError) return fail(422, "estado_invalido", error.message);
    logFailure("falló la recepción de un estado de cuenta", error);
    return fail(500, "error_interno");
  }
}
