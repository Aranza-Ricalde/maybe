import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { STATEMENT_PARSERS, detectStatementBank } from "@/domain/statements/parsers";
import { STATEMENT_BANKS, STATEMENT_BANK_LABELS, type StatementBank } from "@/domain/statements/types";
import { extractPdfWords } from "@/infrastructure/statements/pdfWordExtractor";

const args = process.argv.slice(2);
const bankFlag = args.find((a) => a.startsWith("--bank="))?.slice("--bank=".length);
const files = args.filter((a) => !a.startsWith("--"));

if (files.length === 0 || (bankFlag && !STATEMENT_BANKS.includes(bankFlag as StatementBank))) {
  console.error(`Uso: pnpm statements:inspect [--bank=${STATEMENT_BANKS.join("|")}] archivo.pdf [...]\nSolo imprime estructura, conteos y validaciones; nunca el texto de los movimientos.`);
  process.exit(1);
}

const money = (cents: number) => (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

async function inspect(path: string) {
  const words = await extractPdfWords(new Uint8Array(readFileSync(path)));
  const detected = detectStatementBank(words);
  const bank = (bankFlag as StatementBank | undefined) ?? detected;
  console.log(`\n${basename(path)}`);
  if (!bank) return console.log("  No se reconoce el formato (ningún parser lo detecta).");
  const parsed = STATEMENT_PARSERS[bank].parse(words);
  const byType: Record<string, number> = {};
  for (const t of parsed.transactions) byType[t.type] = (byType[t.type] ?? 0) + 1;
  console.log(`  Banco: ${STATEMENT_BANK_LABELS[bank]}${detected && detected !== bank ? ` (¡parece ${STATEMENT_BANK_LABELS[detected]}!)` : ""}`);
  console.log(`  Periodo: ${parsed.periodStart} → ${parsed.periodEnd} · Cuenta/tarjeta terminada en ${parsed.accountLast4 ?? "?"}`);
  console.log(`  Movimientos: ${parsed.transactions.length} ${JSON.stringify(byType)}`);
  for (const check of parsed.validation.checks) {
    const fmt = (n: number) => (check.isMoney ? money(n) : String(n));
    console.log(`  ${check.expected === check.actual ? "✅" : "⚠️"} ${check.label}: resumen ${fmt(check.expected)} · leído ${fmt(check.actual)}`);
  }
  for (const warning of parsed.warnings) console.log(`  ⚠️ ${warning}`);
}

(async () => {
  for (const file of files) {
    try {
      await inspect(file);
    } catch (error) {
      console.log(`\n${basename(file)}\n  Error: ${error instanceof Error ? error.message : "desconocido"}`);
    }
  }
})();
