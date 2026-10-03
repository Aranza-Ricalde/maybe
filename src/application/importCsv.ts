import type { ImportMappingRepository, ImportRepository } from "@/domain/csvImport/ports";
import { type ColumnMapping, bankSignature, mapRowToTransaction, parseCsv } from "@/domain/csvImport/rules";
import { DuplicateTransactionError, type RecordTransactionUseCase } from "./recordTransaction";

export class MissingColumnMappingError extends Error {
  constructor(public readonly headers: string[]) {
    super(`No hay un mapeo de columnas guardado para este banco. Encabezados: ${headers.join(", ")}`);
  }
}

export interface ImportCsvInput {
  familyId: number;
  accountId: number;
  filename: string;
  csvText: string;
  mapping?: ColumnMapping;
}

export interface ImportCsvSummary {
  importId: number;
  totalRows: number;
  imported: number;
  duplicatesSkipped: number;
  errors: { row: number; message: string }[];
}

export class ImportCsvUseCase {
  constructor(
    private readonly recordTransaction: RecordTransactionUseCase,
    private readonly importRepo: ImportRepository,
    private readonly mappingRepo: ImportMappingRepository,
  ) {}

  async execute(input: ImportCsvInput): Promise<ImportCsvSummary> {
    const { headers, rows } = parseCsv(input.csvText);
    const signature = bankSignature(headers);

    const mapping = input.mapping ?? (await this.mappingRepo.findMapping(input.familyId, signature));
    if (!mapping) {
      throw new MissingColumnMappingError(headers);
    }
    if (input.mapping) {
      await this.mappingRepo.saveMapping(input.familyId, signature, input.mapping);
    }

    const importRecord = await this.importRepo.createImport(input.familyId, input.filename);

    let imported = 0;
    let duplicatesSkipped = 0;
    const errors: { row: number; message: string }[] = [];

    for (const [index, row] of rows.entries()) {
      try {
        const parsed = mapRowToTransaction(row, mapping);
        await this.recordTransaction.execute({
          accountId: input.accountId,
          date: parsed.date,
          amountCents: parsed.amountCents,
          name: parsed.name,
          rawDescription: parsed.rawDescription,
          notes: parsed.notes,
          source: "csv_import",
          importId: importRecord.id,
        });
        imported++;
      } catch (err) {
        if (err instanceof DuplicateTransactionError) {
          duplicatesSkipped++;
        } else {
          errors.push({ row: index + 1, message: err instanceof Error ? err.message : String(err) });
        }
      }
    }

    await this.importRepo.markImportStatus(importRecord.id, imported === 0 && errors.length > 0 ? "failed" : "completed");

    return { importId: importRecord.id, totalRows: rows.length, imported, duplicatesSkipped, errors };
  }
}
