import assert from "node:assert/strict";
import { test } from "node:test";
import type { TransferReviewRepository } from "@/domain/transfers/ports";
import { InvalidTransferReviewError } from "@/domain/transfers/rules";
import { FakeLedger } from "./fakeLedger.testkit";
import { RecordTransactionUseCase } from "./recordTransaction";
import { ResolveTransferSuggestionUseCase } from "./resolveTransferSuggestion";

const MONTH = "2026-10-01";

class FakeReviews implements TransferReviewRepository {
  readonly decisions: Array<[number, string]> = [];
  readonly rejected: Array<[number, number]> = [];
  readonly confirmed = new Set<number>();
  readonly linked = new Set<number>();
  readonly foreign = new Set<number>();

  async listAccounts() { return []; }
  async listStandardTransactions() { return []; }
  async listRejectedPairs() { return []; }
  async listDecidedTransactionIds() { return []; }
  async rejectPair(outflowId: number, inflowId: number) { this.rejected.push([outflowId, inflowId]); }
  async recordDecision(_familyId: number, transactionId: number, _topic: "transfer_suspicion", decision: string) {
    this.decisions.push([transactionId, decision]);
    if (decision === "confirmed_transfer") this.confirmed.add(transactionId);
  }
  async allBelongToFamily(_familyId: number, ids: number[]) { return ids.every((id) => !this.foreign.has(id)); }
  async isConfirmedByReview(transactionId: number) { return this.confirmed.has(transactionId); }
  async clearDecisions(ids: number[]) { for (const id of ids) this.confirmed.delete(id); }
  async isLinkedTransfer(transactionId: number) { return this.linked.has(transactionId); }
}

async function scenario() {
  const ledger = new FakeLedger().addAccount(1).addAccount(2);
  const record = new RecordTransactionUseCase(ledger);
  const outflow = await record.execute({ accountId: 1, date: "2026-10-05", amountCents: -40_000, name: "Ahorro", categoryId: 5, source: "manual" });
  const inflow = await record.execute({ accountId: 2, date: "2026-10-05", amountCents: 40_000, name: "Depósito", source: "manual" });
  const reviews = new FakeReviews();
  return { ledger, reviews, outflow, inflow, useCase: new ResolveTransferSuggestionUseCase(ledger, reviews) };
}

test("confirmar un par: deja de contar como gasto e ingreso, no toca saldos y los enlaza", async () => {
  const { ledger, reviews, outflow, inflow, useCase } = await scenario();
  const balancesBefore = [ledger.balanceOf(1), ledger.balanceOf(2)];

  await useCase.confirmPair(1, outflow.id, inflow.id, "transfer");

  assert.deepEqual(ledger.monthTotals(MONTH), { income: 0, expense: 0 });
  assert.equal(ledger.categoryTotals.get(`5|${MONTH}`), 0);
  assert.deepEqual([ledger.balanceOf(1), ledger.balanceOf(2)], balancesBefore);
  assert.equal(ledger.transactions.get(outflow.id)?.kind, "transfer");
  assert.equal(ledger.transactions.get(inflow.id)?.kind, "transfer");
  assert.deepEqual(ledger.transfers, [[outflow.id, inflow.id]]);
  assert.deepEqual(reviews.decisions.map(([, decision]) => decision), ["confirmed_transfer", "confirmed_transfer"]);
});

test("deshacer devuelve el gasto y el ingreso a sus totales originales", async () => {
  const { ledger, outflow, inflow, useCase } = await scenario();
  await useCase.confirmPair(1, outflow.id, inflow.id, "cc_payment");
  await useCase.undoConfirmed(1, outflow.id);

  assert.deepEqual(ledger.monthTotals(MONTH), { income: 40_000, expense: -40_000 });
  assert.equal(ledger.categoryTotals.get(`5|${MONTH}`), -40_000);
  assert.equal(ledger.transactions.get(outflow.id)?.kind, "standard");
  assert.equal(ledger.transfers.length, 0);
});

test("confirmar un movimiento suelto solo reclasifica ese movimiento", async () => {
  const { ledger, outflow, useCase } = await scenario();
  await useCase.confirmSingle(1, outflow.id, "loan_payment");

  assert.equal(ledger.transactions.get(outflow.id)?.kind, "loan_payment");
  assert.deepEqual(ledger.monthTotals(MONTH), { income: 40_000, expense: 0 });
});

test("se rechazan pares inválidos: mismo movimiento, montos distintos, misma cuenta, otra familia, ya reclasificado, tipo inventado", async () => {
  const { ledger, reviews, outflow, inflow, useCase } = await scenario();
  await assert.rejects(useCase.confirmPair(1, outflow.id, outflow.id, "transfer"), InvalidTransferReviewError);
  await assert.rejects(useCase.confirmPair(1, outflow.id, inflow.id, "inventado"), InvalidTransferReviewError);

  reviews.foreign.add(inflow.id);
  await assert.rejects(useCase.confirmPair(1, outflow.id, inflow.id, "transfer"), /no existe/);
  reviews.foreign.clear();

  const other = await new RecordTransactionUseCase(ledger).execute({ accountId: 2, date: "2026-10-05", amountCents: 999, name: "otro", source: "manual" });
  await assert.rejects(useCase.confirmPair(1, outflow.id, other.id, "transfer"), /mismo monto/);

  await useCase.confirmPair(1, outflow.id, inflow.id, "transfer");
  await assert.rejects(useCase.confirmPair(1, outflow.id, inflow.id, "transfer"), InvalidTransferReviewError);
  assert.deepEqual(ledger.monthTotals(MONTH), { income: 999, expense: 0 });
});

test("descartar guarda la decisión sin tocar el libro, y solo se deshace lo confirmado desde la revisión", async () => {
  const { ledger, reviews, outflow, inflow, useCase } = await scenario();
  await useCase.dismissPair(1, outflow.id, inflow.id);

  assert.deepEqual(reviews.rejected, [[outflow.id, inflow.id]]);
  assert.equal(ledger.transactions.get(outflow.id)?.kind, "standard");
  await assert.rejects(useCase.undoConfirmed(1, outflow.id), /Solo se pueden deshacer/);
});
