import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readStatementUpload, statementErrorResponse } from "@/app/lib/statementUpload";
import { parseStatementUseCase } from "@/infrastructure/container";

export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const upload = await readStatementUpload(request);
  if (upload instanceof NextResponse) return upload;
  try {
    const { preview } = await parseStatementUseCase.execute({ familyId: upload.familyId, accountId: upload.accountId, bank: upload.bank, data: upload.data, password: upload.password });
    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    return statementErrorResponse(error, "POST /api/statements/parse");
  }
}
