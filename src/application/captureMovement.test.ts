import assert from "node:assert/strict";
import { test } from "node:test";
import type { CaptureAccount, CategoryClassifier, CategoryGuess } from "@/domain/captures/ports";
import { CaptureAccountAmbiguousError, CaptureAccountNotFoundError } from "@/domain/captures/rules";
import type { TransactionConceptResolver } from "@/domain/matching/ports";
import { ConfirmCaptureUseCase } from "./confirmCapture";
import { CaptureMovementUseCase } from "./captureMovement";
import { FakeCaptures, fakeCategoriesReader } from "./fakeCaptures.testkit";
import { FakeLedger } from "./fakeLedger.testkit";
import { RecordTransactionUseCase } from "./recordTransaction";
import { UpdateTransactionUseCase } from "./updateTransaction";

function setup(options: { classifier?: CategoryClassifier; learnedCategoryId?: number; accounts?: CaptureAccount[] } = {}) {
  const ledger = new FakeLedger().addAccount(1).addAccount(2);
  const captures = new FakeCaptures(ledger, options.accounts ?? [{ id: 1, name: "BBVA" }, { id: 2, name: "Nu" }]);
  const record = new RecordTransactionUseCase(ledger);
  const update = new UpdateTransactionUseCase(ledger);
  const resolver: TransactionConceptResolver = {
    execute: async (transactionId) => {
      const tx = ledger.transactions.get(transactionId);
      if (tx && options.learnedCategoryId) tx.categoryId = options.learnedCategoryId;
    },
  };
  return { ledger, captures, useCase: new CaptureMovementUseCase(record, update, captures, fakeCategoriesReader, resolver, options.classifier), confirm: new ConfirmCaptureUseCase(captures, ledger, update) };
}

const input = { familyId: 1, account: { name: "bbva" }, type: "expense" as const, amountCents: 15_000, description: "Tacos El Güero" };
const classifierReturning = (guess: CategoryGuess | null): CategoryClassifier => ({ classify: async () => guess });

test("una categoría aprendida por reglas se aplica y no pide confirmación", async () => {
  const { ledger, captures, useCase } = setup({ learnedCategoryId: 10 });
  const result = await useCase.execute(input);

  assert.equal(result.needsConfirmation, false);
  assert.equal(result.categoryName, "Comida");
  assert.equal(result.amountCents, -15_000);
  assert.equal(ledger.balanceOf(1), -15_000);
  assert.equal(ledger.transactions.get(result.transactionId)?.source, "api");
  assert.equal(captures.pending.size, 0);
});

test("sin reglas y sin IA se registra igual y queda por confirmar", async () => {
  const { captures, useCase } = setup();
  const result = await useCase.execute(input);

  assert.equal(result.categoryName, null);
  assert.equal(result.needsConfirmation, true);
  assert.deepEqual([...captures.pending], [result.transactionId]);
});

test("Gemini con confianza alta aplica la categoría sin preguntar", async () => {
  const { captures, useCase } = setup({ classifier: classifierReturning({ categoryId: 10, confidence: "high" }) });
  const result = await useCase.execute(input);

  assert.equal(result.categoryName, "Comida");
  assert.equal(result.needsConfirmation, false);
  assert.equal(captures.pending.size, 0);
});

test("Gemini con confianza media aplica la categoría pero pide confirmación", async () => {
  const { captures, useCase } = setup({ classifier: classifierReturning({ categoryId: 11, confidence: "medium" }) });
  const result = await useCase.execute(input);

  assert.equal(result.categoryName, "Transporte");
  assert.equal(result.needsConfirmation, true);
  assert.equal(captures.pending.size, 1);
});

test("Gemini con confianza baja, categoría ajena al tipo o error no se aplica y queda por confirmar", async () => {
  for (const classifier of [classifierReturning({ categoryId: 10, confidence: "low" }), classifierReturning({ categoryId: 20, confidence: "high" }), { classify: async () => { throw new Error("caído"); } }]) {
    const { useCase } = setup({ classifier });
    const result = await useCase.execute(input);
    assert.equal(result.categoryName, null);
    assert.equal(result.needsConfirmation, true);
  }
});

test("un ingreso suma al saldo y solo ofrece categorías de ingreso a Gemini", async () => {
  let offered: number[] = [];
  const { ledger, useCase } = setup({ classifier: { classify: async ({ categories }) => { offered = categories.map((c) => c.id); return null; } } });
  await useCase.execute({ ...input, type: "income", description: "Nómina" });

  assert.deepEqual(offered, [20]);
  assert.equal(ledger.balanceOf(1), 15_000);
});

test("la cuenta se busca por nombre exacto sin importar mayúsculas ni acentos, y falla si no existe o es ambigua", async () => {
  await assert.rejects(setup().useCase.execute({ ...input, account: { name: "Santander" } }), CaptureAccountNotFoundError);
  await assert.rejects(setup({ accounts: [{ id: 1, name: "Nu" }, { id: 2, name: "NU" }] }).useCase.execute({ ...input, account: { name: "nu" } }), CaptureAccountAmbiguousError);
  assert.equal((await setup({ accounts: [{ id: 1, name: "Crédito" }] }).useCase.execute({ ...input, account: { name: "credito" } })).accountName, "Crédito");
});

test("confirmar cambia la categoría elegida y deja de estar pendiente; repetirlo se rechaza", async () => {
  const { ledger, captures, useCase, confirm } = setup();
  const { transactionId } = await useCase.execute(input);

  await confirm.execute(1, transactionId, 11);
  assert.equal(ledger.transactions.get(transactionId)?.categoryId, 11);
  assert.equal(captures.pending.size, 0);
  await assert.rejects(confirm.execute(1, transactionId, 11), /ya no está por confirmar/);
});
