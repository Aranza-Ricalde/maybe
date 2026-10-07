import { STATEMENT_PARSERS, detectStatementBank } from "@/domain/statements/parsers";
import type { PdfTextExtractor, StatementContextRepository } from "@/domain/statements/ports";
import type { StatementPreview } from "@/domain/statements/reconcile";
import { BankMismatchError, EmptyStatementError, StatementFormatError, type ParsedStatement, type StatementBank } from "@/domain/statements/types";
import { logInfo } from "@/lib/log";
import { ReconcileStatementUseCase, requireStatementAccount } from "./reconcileStatement";

export interface ParseStatementInput {
  familyId: number;
  accountId: number;
  bank: StatementBank;
  data: Uint8Array;
  password?: string;
}

export interface ParseStatementResult {
  statement: ParsedStatement;
  preview: StatementPreview;
}

export class ParseStatementUseCase {
  constructor(
    private readonly extractor: PdfTextExtractor,
    private readonly context: StatementContextRepository,
    private readonly reconcile: ReconcileStatementUseCase,
  ) {}

  async execute({ familyId, accountId, bank, data, password }: ParseStatementInput): Promise<ParseStatementResult> {
    await requireStatementAccount(this.context, familyId, accountId);
    try {
      const words = await this.extractor.extract(data, password);
      const parser = STATEMENT_PARSERS[bank];
      if (!parser.detect(words)) {
        const other = detectStatementBank(words);
        throw other ? new BankMismatchError(other) : new StatementFormatError("No se reconoce el formato del estado de cuenta.");
      }
      const statement = parser.parse(words);
      if (statement.transactions.length === 0) throw new EmptyStatementError("No se encontraron movimientos en el estado.");
      const preview = await this.reconcile.execute(familyId, accountId, statement);
      logInfo("estado de cuenta procesado", { bank, movimientos: statement.transactions.length, totalesCuadran: statement.validation.matches, ok: true });
      return { statement, preview };
    } catch (error) {
      logInfo("estado de cuenta rechazado", { bank, ok: false, motivo: error instanceof Error ? error.constructor.name : "desconocido" });
      throw error;
    }
  }
}
