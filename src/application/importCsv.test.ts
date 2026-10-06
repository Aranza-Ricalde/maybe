import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_CSV_ROWS } from "@/domain/csvImport/rules";
import type { ImportMappingRepository, ImportRepository } from "@/domain/csvImport/ports";
import { FakeLedger } from "./fakeLedger.testkit";
import { CsvTooLargeError, ImportCsvUseCase, MissingColumnMappingError } from "./importCsv";
import { RecordTransactionUseCase } from "./recordTransaction";

const MAPPING = { date: "Fecha", amount: "Monto", name: "Descripción" };

function setup(savedMapping: typeof MAPPING | null = MAPPING) {
  const ledger = new FakeLedger().addAccount(1);
  const statuses: string[] = [];
  const saved: unknown[] = [];
  const imports: ImportRepository = {
    createImport: async (familyId, filename) => ({ id: 1, familyId, filename, status: "pending" }),
    markImportStatus: async (_id, status) => void statuses.push(status),
  };
  const mappings: ImportMappingRepository = { findMapping: async () => savedMapping, saveMapping: async (_f, _s, mapping) => void saved.push(mapping) };
  return { ledger, statuses, saved, useCase: new ImportCsvUseCase(new RecordTransactionUseCase(ledger), imports, mappings) };
}

const csv = (rows: string[]) => ["Fecha,Monto,Descripción", ...rows].join("\n");
const base = { familyId: 1, accountId: 1, filename: "banco.csv" };

test("importa las filas válidas, reporta las inválidas con su número y marca la importación como completada", async () => {
  const { ledger, statuses, useCase } = setup();
  const summary = await useCase.execute({ ...base, csvText: csv(["2026-10-01,-100.50,Tacos", "no-es-fecha,-5,Mal", "2026-10-02,2000,Nómina"]) });

  assert.equal(summary.totalRows, 3);
  assert.equal(summary.imported, 2);
  assert.equal(summary.errors.length, 1);
  assert.equal(summary.errors[0].row, 2);
  assert.equal(ledger.balanceOf(1), -10_050 + 200_000);
  assert.deepEqual(statuses, ["completed"]);
});

test("un movimiento manual igual que una fila del CSV cuenta como duplicado y no se importa", async () => {
  const { ledger, useCase } = setup();
  await new RecordTransactionUseCase(ledger).execute({ accountId: 1, date: "2026-10-01", amountCents: -10_050, name: "Tacos", source: "manual" });
  const summary = await useCase.execute({ ...base, csvText: csv(["2026-10-01,-100.50,Tacos"]) });

  assert.equal(summary.duplicatesSkipped, 1);
  assert.equal(summary.imported, 0);
});

test("si todas las filas fallan, la importación queda como fallida", async () => {
  const { statuses, useCase } = setup();
  const summary = await useCase.execute({ ...base, csvText: csv(["x,y,z"]) });

  assert.equal(summary.imported, 0);
  assert.deepEqual(statuses, ["failed"]);
});

test("sin mapeo guardado ni indicado se pide el mapeo, y uno indicado se guarda", async () => {
  await assert.rejects(setup(null).useCase.execute({ ...base, csvText: csv(["2026-10-01,-1,a"]) }), MissingColumnMappingError);

  const { saved, useCase } = setup(null);
  await useCase.execute({ ...base, csvText: csv(["2026-10-01,-1,a"]), mapping: MAPPING });
  assert.deepEqual(saved, [MAPPING]);
});

test("un archivo con más filas que el máximo se rechaza antes de escribir nada", async () => {
  const { ledger, useCase } = setup();
  const rows = Array.from({ length: MAX_CSV_ROWS + 1 }, (_, index) => `2026-10-01,-1,Fila ${index}`);
  await assert.rejects(useCase.execute({ ...base, csvText: csv(rows) }), CsvTooLargeError);
  assert.equal(ledger.transactions.size, 0);
});
