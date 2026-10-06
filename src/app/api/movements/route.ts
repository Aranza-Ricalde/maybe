import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clientIp } from "@/app/lib/clientIp";
import { API_TOKEN_IP_POLICY } from "@/domain/auth/attemptLimit";
import { CaptureAccountAmbiguousError, CaptureAccountNotFoundError, InvalidCaptureError } from "@/domain/captures/rules";
import { InvalidTransactionError } from "@/domain/ledger/rules";
import { UnreadableNotificationError } from "@/application/captureNotification";
import { authenticateApiTokenUseCase, captureMovementUseCase, captureNotificationUseCase, loginAttemptLimiter } from "@/infrastructure/container";
import { logFailure } from "@/lib/log";
import { capturePayload } from "@/lib/schemas";

const MAX_BODY_CHARS = 10_000;
const BEARER = /^Bearer\s+(\S+)$/i;
const MS_PER_SECOND = 1000;

const fail = (status: number, error: string, extra: Record<string, unknown> = {}, headers?: HeadersInit) => NextResponse.json({ ok: false, error, ...extra }, { status, headers });

const ACCOUNT_HEADER = "x-account";
const ACCOUNT_QUERY = "account";
const JSON_TYPE = "application/json";

function accountFrom(request: NextRequest): string {
  return (request.headers.get(ACCOUNT_HEADER) ?? request.nextUrl.searchParams.get(ACCOUNT_QUERY) ?? "").trim();
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ipKey = `api-ip:${clientIp(request)}`;
  const decision = await loginAttemptLimiter.check(ipKey, API_TOKEN_IP_POLICY);
  if (!decision.allowed) return fail(429, "demasiados_intentos", {}, { "Retry-After": String(Math.ceil(decision.retryAfterMs / MS_PER_SECOND)) });

  const token = request.headers.get("authorization")?.match(BEARER)?.[1];
  const familyId = token ? await authenticateApiTokenUseCase.execute(token) : null;
  if (familyId == null) {
    await loginAttemptLimiter.recordFailure(ipKey, API_TOKEN_IP_POLICY);
    return fail(401, "token_invalido");
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) return fail(413, "cuerpo_demasiado_grande");

  const isJson = (request.headers.get("content-type") ?? "").includes(JSON_TYPE);
  const parsed = isJson ? capturePayload.safeParse(parseJson(raw)) : undefined;
  if (parsed && !parsed.success) {
    return fail(400, "datos_invalidos", { detalles: parsed.error.issues.map((issue) => ({ campo: issue.path.join("."), mensaje: issue.message })) });
  }
  const account = accountFrom(request);
  if (!parsed && (!account || !raw.trim())) return fail(400, "datos_invalidos", { mensaje: "Con texto plano manda la cuenta en ?account= o en el encabezado X-Account, y la notificación como cuerpo." });

  try {
    const result = parsed?.success ? await captureMovementUseCase.execute({ familyId, account: { name: parsed.data.accountName }, ...parsed.data.movement }) : await captureNotificationUseCase.execute(familyId, { name: account }, raw);
    return NextResponse.json(
      {
        ok: true,
        id: result.transactionId,
        cuenta: result.accountName,
        fecha: result.date,
        monto: result.amountCents / 100,
        descripcion: result.description,
        categoria: result.categoryName,
        comercio: result.merchantName,
        por_confirmar: result.needsConfirmation,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof UnreadableNotificationError) return fail(422, "notificacion_no_entendida", { mensaje: error.message });
    if (error instanceof CaptureAccountNotFoundError) return fail(404, "cuenta_no_encontrada", { mensaje: error.message });
    if (error instanceof CaptureAccountAmbiguousError) return fail(409, "cuenta_ambigua", { mensaje: error.message });
    if (error instanceof InvalidCaptureError || error instanceof InvalidTransactionError) return fail(422, "movimiento_invalido", { mensaje: error.message });
    logFailure("POST /api/movements falló", error);
    return fail(500, "error_interno");
  }
}
