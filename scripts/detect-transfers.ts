import { db } from "@/infrastructure/db/client";
import { families } from "@/infrastructure/db/schema/core";
import { DrizzleTransferReviewRepository } from "@/infrastructure/db/transferReview";
import { detectTransferSuggestions } from "@/domain/transfers/detection";
import { TRANSFER_KIND_LABELS } from "@/domain/transfers/rules";

async function main() {
  console.log("Base:", process.env.DATABASE_URL?.split("@")[1]?.split("/")[0], "(solo lectura)");
  const [family] = await db.select().from(families).limit(1);
  const repo = new DrizzleTransferReviewRepository();
  const [accounts, transactions, rejected] = await Promise.all([repo.listAccounts(family.id), repo.listStandardTransactions(family.id), repo.listRejectedPairs(family.id)]);
  const decided = await repo.listDecidedTransactionIds(family.id, "transfer_suspicion", "not_a_transfer").catch(() => [] as number[]);

  const result = detectTransferSuggestions({
    accounts,
    transactions,
    rejectedPairs: new Set(rejected.map((x) => `${x.outflowId}:${x.inflowId}`)),
    dismissedTransactionIds: new Set(decided),
  });
  const byId = new Map(transactions.map((t) => [t.id, t]));
  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  const money = (cents: number) => `${cents < 0 ? "-" : "+"}$${Math.round(Math.abs(cents) / 100).toLocaleString("en-US")}`;
  const line = (id: number) => {
    const t = byId.get(id)!;
    return `${t.date} ${accountName.get(t.accountId)}: "${t.name.slice(0, 42)}" ${money(t.amountCents)}${t.categoryName ? ` [${t.categoryName}]` : ""}`;
  };

  console.log(`\nPARES (${result.pairs.length}):`);
  for (const p of result.pairs) {
    console.log(`  [${p.confidence === "strong" ? "SEGURA " : "REVISAR"}] ${TRANSFER_KIND_LABELS[p.kind]} (puntaje ${p.score})${p.alternativeIds.length ? ` — alternativas: ${p.alternativeIds.join(", ")}` : ""}`);
    console.log(`            ${line(p.outflowId)}\n            ${line(p.inflowId)}`);
  }
  console.log(`\nSUELTAS (${result.singles.length}):`);
  for (const s of result.singles) console.log(`  [REVISAR] ${TRANSFER_KIND_LABELS[s.kind]}: ${line(s.transactionId)}\n            ${s.reasons[0]}`);
  console.log(`\nSin datos suficientes (no se sugieren; se marcan desde su fila): ${result.undecidedCount}`);

  const all = [...result.pairs.flatMap((p) => [p.outflowId, p.inflowId]), ...result.singles.map((s) => s.transactionId)].map((id) => byId.get(id)!);
  const expense = all.filter((t) => t.amountCents < 0).reduce((s, t) => s - t.amountCents, 0);
  const income = all.filter((t) => t.amountCents > 0).reduce((s, t) => s + t.amountCents, 0);
  console.log(`\nSi confirmaras todo: dejarían de contarse ${money(expense).slice(1)} de GASTO y ${money(income).slice(1)} de INGRESO (${all.length} movimientos).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
