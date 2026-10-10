import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/app/lib/dal";
import { REVALIDATE, revalidateRoutes } from "@/app/lib/revalidation";
import { statementErrorResponse, statementFail } from "@/app/lib/statementUpload";
import { statementInbox, undoStatementImportUseCase } from "@/infrastructure/container";
import { logFailure } from "@/lib/log";

const body = z.object({ importId: z.number().int().positive() });

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return statementFail(401, "no_autenticado");

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return statementFail(400, "datos_invalidos", "Falta la importación a deshacer.");

  try {
    const result = await undoStatementImportUseCase.execute(user.familyId, parsed.data.importId);
    await statementInbox.restoreByImport(user.familyId, parsed.data.importId).catch((error) => logFailure("restaurar el estado de la bandeja falló", error));
    revalidateRoutes(REVALIDATE.statementImport);
    return NextResponse.json({ ok: true, eliminados: result.removed, desvinculados: result.unlinked });
  } catch (error) {
    return statementErrorResponse(error, "POST /api/statements/undo");
  }
}
