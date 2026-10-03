/**
 * Valida ImportCsvUseCase contra la base real de Neon: parseo con comillas,
 * detección de duplicados cruzando con una transacción manual, filas con
 * error que no abortan el import completo, y mapeo de columnas recordado.
 * Uso: pnpm exec tsx --env-file=.env.local scripts/smoke-test-csv-import.ts
 */
import { eq } from "drizzle-orm";
import { RecordTransactionUseCase } from "@/application/recordTransaction";
import { ImportCsvUseCase, MissingColumnMappingError } from "@/application/importCsv";
import { db } from "@/infrastructure/db/client";
import { DrizzleImportMappingRepository, DrizzleImportRepository } from "@/infrastructure/db/csvImport";
import { DrizzleLedgerUnitOfWork } from "@/infrastructure/db/ledger";
import { accounts } from "@/infrastructure/db/schema/accounts";
import { families } from "@/infrastructure/db/schema/core";
import { importMappings, imports } from "@/infrastructure/db/schema/imports";
import { transactions } from "@/infrastructure/db/schema/transactions";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FALLÓ: ${message}`);
}

const CSV_WITH_DUPLICATE = `Date,Description,Amount
2026-01-05,"Super, tienda principal",-500.00
2026-01-06,Netflix,-150.00
2026-01-07,"Depósito de nómina",20000.00
2026-01-08,Fila mala,no-es-un-numero
`;

const CSV_SECOND_BATCH = `Date,Description,Amount
2026-02-01,Spotify,-99.00
`;

async function main() {
  console.log("Creando datos de prueba...");
  const [family] = await db.insert(families).values({ name: "__smoke_test__", currency: "MXN" }).returning();
  const [account] = await db
    .insert(accounts)
    .values({ familyId: family.id, name: "__smoke_test_checking__", type: "checking" })
    .returning();

  const recordTransaction = new RecordTransactionUseCase(new DrizzleLedgerUnitOfWork(db));
  const importCsv = new ImportCsvUseCase(recordTransaction, new DrizzleImportRepository(), new DrizzleImportMappingRepository());

  try {
    console.log("1) Registrando a mano la misma compra que luego viene en el CSV...");
    await recordTransaction.execute({
      accountId: account.id,
      date: "2026-01-05",
      amountCents: -50000,
      name: "Super",
      source: "manual",
    });

    console.log("2) Importando CSV con comillas, un duplicado, y una fila con monto inválido...");
    const summary = await importCsv.execute({
      familyId: family.id,
      accountId: account.id,
      filename: "enero.csv",
      csvText: CSV_WITH_DUPLICATE,
      mapping: { date: "Date", amount: "Amount", name: "Description" },
    });

    assert(summary.totalRows === 4, `totalRows esperado 4, llegó ${summary.totalRows}`);
    assert(summary.imported === 2, `imported esperado 2 (Netflix + Depósito), llegó ${summary.imported}`);
    assert(summary.duplicatesSkipped === 1, `duplicatesSkipped esperado 1 (Super), llegó ${summary.duplicatesSkipped}`);
    assert(summary.errors.length === 1, `errors esperado 1 (monto inválido), llegó ${summary.errors.length}`);
    assert(summary.errors[0].row === 4, `el error debía ser la fila 4, fue la fila ${summary.errors[0].row}`);
    console.log(`   ✓ ${summary.imported} importadas, ${summary.duplicatesSkipped} duplicado(s), ${summary.errors.length} error(es) — "${summary.errors[0].message}"`);

    const [importRow] = await db.select().from(imports).where(eq(imports.id, summary.importId));
    assert(importRow.status === "completed", `el import debía quedar "completed", quedó "${importRow.status}"`);
    console.log("   ✓ el registro de import quedó en estado completed");

    const [savedMapping] = await db
      .select()
      .from(importMappings)
      .where(eq(importMappings.familyId, family.id));
    assert(savedMapping != null, "el mapeo de columnas debió quedar guardado para este formato de banco");
    console.log("   ✓ mapeo de columnas guardado (bank_signature:", savedMapping.bankSignature, ")");

    console.log("3) Importando un segundo CSV del MISMO banco, SIN pasar mapping explícito...");
    const secondSummary = await importCsv.execute({
      familyId: family.id,
      accountId: account.id,
      filename: "febrero.csv",
      csvText: CSV_SECOND_BATCH,
      // sin mapping — debe recordarlo de la vez anterior
    });
    assert(secondSummary.imported === 1, `se esperaba importar 1 fila (Spotify), llegó ${secondSummary.imported}`);
    console.log("   ✓ el mapeo recordado se usó sin que lo volviera a pasar");

    console.log("4) Importando un CSV de un banco nunca visto, sin mapping (debe pedir que se mapee)...");
    let threwMissingMapping = false;
    try {
      await importCsv.execute({
        familyId: family.id,
        accountId: account.id,
        filename: "otro-banco.csv",
        csvText: "Fecha,Concepto,Cargo\n2026-03-01,Algo,-10.00\n",
      });
    } catch (err) {
      if (err instanceof MissingColumnMappingError) threwMissingMapping = true;
      else throw err;
    }
    assert(threwMissingMapping, "un formato de banco nuevo sin mapping debió lanzar MissingColumnMappingError");
    console.log("   ✓ formato de banco desconocido pide mapeo en vez de adivinar");

    console.log("\nTODAS LAS VALIDACIONES PASARON ✓");
  } finally {
    console.log("\nLimpiando datos de prueba...");
    await db.delete(transactions).where(eq(transactions.accountId, account.id));
    await db.delete(imports).where(eq(imports.familyId, family.id));
    await db.delete(importMappings).where(eq(importMappings.familyId, family.id));
    await db.delete(accounts).where(eq(accounts.familyId, family.id));
    await db.delete(families).where(eq(families.id, family.id));
    console.log("Limpieza completa, no quedó basura en production.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
