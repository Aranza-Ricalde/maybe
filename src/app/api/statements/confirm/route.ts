import { after, NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { REVALIDATE, revalidateRoutes } from "@/app/lib/revalidation";
import { readStatementUpload, statementFail, statementErrorResponse } from "@/app/lib/statementUpload";
import { confirmStatementImportUseCase, enrichImportedTransactionsUseCase, parseStatementUseCase, statementInbox } from "@/infrastructure/container";
import { logFailure } from "@/lib/log";
import { statementDecisionsPayload } from "@/lib/schemas";

export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const upload = await readStatementUpload(request);
  if (upload instanceof NextResponse) return upload;

  const rawDecisions = upload.form.get("decisions");
  let json: unknown;
  try {
    json = typeof rawDecisions === "string" ? JSON.parse(rawDecisions) : [];
  } catch {
    return statementFail(400, "datos_invalidos", "Las decisiones no son un JSON válido.");
  }
  const decisions = statementDecisionsPayload.safeParse(json);
  if (!decisions.success) return statementFail(400, "datos_invalidos", "Las decisiones no son válidas.");

  try {
    const { statement } = await parseStatementUseCase.execute({ familyId: upload.familyId, accountId: upload.accountId, bank: upload.bank, data: upload.data, password: upload.password });
    const result = await confirmStatementImportUseCase.execute({ familyId: upload.familyId, accountId: upload.accountId, statement, decisions: decisions.data, acknowledgeMismatch: upload.form.get("acknowledgeMismatch") === "true", signal: request.signal });
    await statementInbox.markImportedByContent(upload.familyId, upload.data, result.importId).catch((error) => logFailure("marcar el estado de la bandeja como importado falló", error));
    revalidateRoutes(REVALIDATE.statementImport);
    after(() => enrichImportedTransactionsUseCase.execute(upload.familyId, result.insertedTransactionIds).catch((error) => logFailure("enriquecer movimientos importados falló", error)));
    return NextResponse.json({ ok: true, importId: result.importId, importados: result.imported, vinculados: result.linked, omitidos: result.skipped, emparejados: result.paired });
  } catch (error) {
    return statementErrorResponse(error, "POST /api/statements/confirm");
  }
}
