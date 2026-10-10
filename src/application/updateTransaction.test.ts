import assert from "node:assert/strict";
import { test } from "node:test";
import type { LedgerOperations, LedgerUnitOfWork } from "@/domain/ledger/ports";
import { InvalidTransactionError } from "@/domain/ledger/rules";
import { UpdateTransactionUseCase } from "./updateTransaction";

function failingUow() {
  let runs = 0;
  const uow = {
    run: async (fn: (ops: LedgerOperations) => Promise<unknown>) => {
      runs += 1;
      return fn({ getTransaction: async () => null } as unknown as LedgerOperations);
    },
  } as unknown as LedgerUnitOfWork;
  return { uow, runs: () => runs };
}

test("actualizar varios movimientos usa una sola unidad de trabajo", async () => {
  const { uow, runs } = failingUow();
  const useCase = new UpdateTransactionUseCase(uow);
  const inputs = [1, 2].map((id) => ({ id, accountId: 1, date: "2026-10-01", amountCents: -100, name: "Café", categoryId: 3 }));
  await assert.rejects(() => useCase.executeMany(inputs), InvalidTransactionError);
  assert.equal(runs(), 1);
});

test("un dato inválido en el lote se rechaza antes de abrir la transacción", async () => {
  const { uow, runs } = failingUow();
  const useCase = new UpdateTransactionUseCase(uow);
  const bad = { id: 1, accountId: 1, date: "no-es-fecha", amountCents: -100, name: "Café", categoryId: 3 };
  await assert.rejects(() => useCase.executeMany([bad]));
  assert.equal(runs(), 0);
});
