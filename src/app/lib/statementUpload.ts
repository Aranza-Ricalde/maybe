import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BankMismatchError, EmptyStatementError, InvalidStatementDecisionError, StatementAccountError, StatementAlreadyImportedError, StatementFormatError, StatementPasswordError, StatementTotalsMismatchError, STATEMENT_BANKS, type StatementBank } from "@/domain/statements/types";
import { InvalidTransactionError } from "@/domain/ledger/rules";
import { logFailure } from "@/lib/log";
import { getCurrentUser } from "./dal";

export const MAX_STATEMENT_BYTES = 4 * 1024 * 1024;
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d];
const PDF_TYPE = "application/pdf";
const MAX_PASSWORD_CHARS = 200;

export const statementFail = (status: number, error: string, mensaje?: string) => NextResponse.json({ ok: false, error, ...(mensaje ? { mensaje } : {}) }, { status });

export interface StatementUpload {
  familyId: number;
  accountId: number;
  bank: StatementBank;
  data: Uint8Array;
  password?: string;
  form: FormData;
}

export async function readStatementUpload(request: NextRequest): Promise<StatementUpload | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return statementFail(401, "no_autenticado");

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_STATEMENT_BYTES + MULTIPART_OVERHEAD_BYTES) return statementFail(413, "archivo_demasiado_grande", "El PDF pesa más de 4 MB.");
  if (!(request.headers.get("content-type") ?? "").startsWith("multipart/form-data")) return statementFail(400, "datos_invalidos", "Se esperaba un formulario con el PDF.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return statementFail(400, "datos_invalidos", "No se pudo leer el formulario.");
  }

  const file = form.get("file");
  const bank = form.get("bank");
  const accountId = Number(form.get("accountId"));
  if (!(file instanceof File)) return statementFail(400, "datos_invalidos", "Falta el archivo PDF.");
  if (typeof bank !== "string" || !STATEMENT_BANKS.includes(bank as StatementBank)) return statementFail(400, "datos_invalidos", "Elige el banco y producto del estado.");
  if (!Number.isInteger(accountId) || accountId <= 0) return statementFail(400, "datos_invalidos", "Elige la cuenta donde se importará.");
  if (file.size > MAX_STATEMENT_BYTES) return statementFail(413, "archivo_demasiado_grande", "El PDF pesa más de 4 MB.");
  if (file.type !== PDF_TYPE) return statementFail(415, "tipo_no_permitido", "Solo se aceptan archivos PDF.");

  const data = new Uint8Array(await file.arrayBuffer());
  if (data.length === 0 || !PDF_MAGIC.every((byte, i) => data[i] === byte)) return statementFail(415, "tipo_no_permitido", "El archivo no es un PDF válido.");

  const rawPassword = form.get("password");
  const password = typeof rawPassword === "string" && rawPassword.length > 0 && rawPassword.length <= MAX_PASSWORD_CHARS ? rawPassword : undefined;
  return { familyId: user.familyId, accountId, bank: bank as StatementBank, data, password, form };
}

export function statementErrorResponse(error: unknown, route: string): NextResponse {
  if (error instanceof StatementPasswordError) return statementFail(422, "pdf_protegido", "PDF protegido: ingresa la contraseña para abrirlo.");
  if (error instanceof StatementFormatError) return statementFail(422, "formato_no_reconocido", "No se reconoce el formato del estado de cuenta.");
  if (error instanceof BankMismatchError) return statementFail(422, "banco_no_coincide", error.message);
  if (error instanceof EmptyStatementError) return statementFail(422, "sin_movimientos", "No se encontraron movimientos en el estado.");
  if (error instanceof StatementAccountError) return statementFail(404, "cuenta_invalida", error.message);
  if (error instanceof StatementTotalsMismatchError) return statementFail(409, "totales_no_cuadran", error.message);
  if (error instanceof StatementAlreadyImportedError) return statementFail(409, "ya_importado", error.message);
  if (error instanceof InvalidStatementDecisionError || error instanceof InvalidTransactionError) return statementFail(422, "decision_invalida", error.message);
  logFailure(`${route} falló`, error);
  return statementFail(500, "error_interno");
}
