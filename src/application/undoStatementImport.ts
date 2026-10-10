import type { StatementImportUnitOfWork } from "@/domain/statements/ports";
import { ImportNotFoundError, UndoNotPossibleError } from "@/domain/statements/importControl";
import { reverseTransaction } from "./applyTransactionDelta";

const IMPORTED_SOURCE = "statement_import";

export interface UndoStatementImportResult {
  removed: number;
  unlinked: number;
}

export class UndoStatementImportUseCase {
  constructor(private readonly uow: StatementImportUnitOfWork) {}

  async execute(familyId: number, importId: number): Promise<UndoStatementImportResult> {
    return this.uow.run(async (ops) => {
      const record = await ops.findImport(importId);
      if (!record || record.familyId !== familyId) throw new ImportNotFoundError("Esa importación no existe.");

      const rows = await ops.listImportTransactions(importId);
      for (const row of rows) {
        if ((await ops.findTransferPartner(row.id)) != null) {
          throw new UndoNotPossibleError("Esta importación emparejó transferencias entre cuentas y no se puede deshacer automáticamente.");
        }
      }

      let removed = 0;
      let unlinked = 0;
      for (const row of rows) {
        if (row.source === IMPORTED_SOURCE) {
          const transaction = await ops.getTransaction(row.id);
          if (!transaction) continue;
          await reverseTransaction(ops, transaction);
          await ops.deleteTransactionRow(row.id);
          removed++;
        } else {
          await ops.unlinkStatementRow(row.id);
          unlinked++;
        }
      }
      await ops.deleteImportRecord(importId);
      return { removed, unlinked };
    });
  }
}
