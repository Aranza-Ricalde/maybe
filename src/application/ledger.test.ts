import assert from "node:assert/strict";
import { test } from "node:test";
import { InvalidTransactionError } from "@/domain/ledger/rules";
import { FakeLedger } from "./fakeLedger.testkit";
import { DeleteTransactionUseCase } from "./deleteTransaction";
import { DuplicateTransactionError, RecordTransactionUseCase } from "./recordTransaction";
import { RecordTransferUseCase } from "./recordTransfer";
import { UpdateTransactionUseCase } from "./updateTransaction";

const MONTH = "2026-10-01";

function ledger() {
  return new FakeLedger().addAccount(1).addAccount(2).addAccount(3, { isActive: false });
}

const expense = { accountId: 1, date: "2026-10-05", amountCents: -15_000, name: "Tacos", categoryId: 7, source: "manual" as const };

test("registrar un gasto mueve el saldo, el total de la categoría y el gasto del mes", async () => {
  const fake = ledger();
  await new RecordTransactionUseCase(fake).execute(expense);

  assert.equal(fake.balanceOf(1), -15_000);
  assert.equal(fake.categoryTotals.get(`7|${MONTH}`), -15_000);
  assert.deepEqual(fake.monthTotals(MONTH), { income: 0, expense: -15_000 });
});

test("registrar un ingreso suma al ingreso del mes y no toca el gasto", async () => {
  const fake = ledger();
  await new RecordTransactionUseCase(fake).execute({ ...expense, amountCents: 50_000, categoryId: undefined, name: "Nómina" });

  assert.deepEqual(fake.monthTotals(MONTH), { income: 50_000, expense: 0 });
  assert.equal(fake.categoryTotals.size, 0);
});

test("cuenta inexistente, inactiva, monto cero y nombre vacío se rechazan sin escribir nada", async () => {
  const fake = ledger();
  const record = new RecordTransactionUseCase(fake);
  await assert.rejects(record.execute({ ...expense, accountId: 99 }), InvalidTransactionError);
  await assert.rejects(record.execute({ ...expense, accountId: 3 }), /inactiva/);
  await assert.rejects(record.execute({ ...expense, amountCents: 0 }), InvalidTransactionError);
  await assert.rejects(record.execute({ ...expense, name: "  " }), InvalidTransactionError);
  assert.equal(fake.transactions.size, 0);
  assert.equal(fake.balanceOf(1), 0);
});

test("importar de CSV un movimiento que ya existe a mano se rechaza como duplicado", async () => {
  const fake = ledger();
  const record = new RecordTransactionUseCase(fake);
  await record.execute(expense);
  await assert.rejects(record.execute({ ...expense, source: "csv_import" }), DuplicateTransactionError);
  await record.execute({ ...expense, source: "csv_import" }, { skipDuplicateCheck: true });
  assert.equal(fake.transactions.size, 2);
});

test("actualizar un movimiento revierte lo anterior y aplica lo nuevo, incluso entre cuentas y meses", async () => {
  const fake = ledger();
  const created = await new RecordTransactionUseCase(fake).execute(expense);

  await new UpdateTransactionUseCase(fake).execute({ id: created.id, accountId: 2, date: "2026-11-02", amountCents: -20_000, name: "Tacos", categoryId: 8 });

  assert.equal(fake.balanceOf(1), 0);
  assert.equal(fake.balanceOf(2), -20_000);
  assert.deepEqual(fake.monthTotals(MONTH), { income: 0, expense: 0 });
  assert.deepEqual(fake.monthTotals("2026-11-01"), { income: 0, expense: -20_000 });
  assert.equal(fake.categoryTotals.get(`7|${MONTH}`), 0);
  assert.equal(fake.categoryTotals.get("8|2026-11-01"), -20_000);
});

test("actualizar un movimiento inexistente se rechaza", async () => {
  await assert.rejects(new UpdateTransactionUseCase(ledger()).execute({ id: 5, accountId: 1, date: "2026-10-05", amountCents: -1, name: "x", categoryId: null }), /no existe/);
});

test("borrar un movimiento deja saldos y agregados como estaban", async () => {
  const fake = ledger();
  const created = await new RecordTransactionUseCase(fake).execute(expense);
  await new DeleteTransactionUseCase(fake).execute(created.id);

  assert.equal(fake.transactions.size, 0);
  assert.equal(fake.balanceOf(1), 0);
  assert.deepEqual(fake.monthTotals(MONTH), { income: 0, expense: 0 });
  assert.equal(fake.categoryTotals.get(`7|${MONTH}`), 0);
});

test("una transferencia mueve ambos saldos, enlaza las dos patas y no cuenta como ingreso ni gasto", async () => {
  const fake = ledger();
  const { outflow, inflow } = await new RecordTransferUseCase(fake).execute({ kind: "transfer", fromAccountId: 1, toAccountId: 2, date: "2026-10-05", amountCents: 30_000 });

  assert.equal(fake.balanceOf(1), -30_000);
  assert.equal(fake.balanceOf(2), 30_000);
  assert.deepEqual(fake.transfers, [[outflow.id, inflow.id]]);
  assert.deepEqual(fake.monthTotals(MONTH), { income: 0, expense: 0 });
  assert.equal(outflow.kind, "transfer");
});

test("transferencias inválidas: misma cuenta, cuenta inactiva o tipo desconocido", async () => {
  const transfer = new RecordTransferUseCase(ledger());
  const base = { kind: "transfer" as const, fromAccountId: 1, toAccountId: 2, date: "2026-10-05", amountCents: 100 };
  await assert.rejects(transfer.execute({ ...base, toAccountId: 1 }), /misma/);
  await assert.rejects(transfer.execute({ ...base, toAccountId: 3 }), /inactiva/);
  await assert.rejects(transfer.execute({ ...base, kind: "standard" as never }), InvalidTransactionError);
});
