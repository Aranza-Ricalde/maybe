import assert from "node:assert/strict";
import { test } from "node:test";
import type { UncategorizedTransaction } from "@/domain/categories/ports";
import { InvalidCategoryReviewError } from "@/domain/categories/reviewQueue";
import { CategorizeProviderUseCase } from "./categorizeProvider";

const tx = (id: number, providerId: number, amountCents: number, name = "OXXO"): UncategorizedTransaction => ({ id, accountId: 1, date: "2026-03-01", amountCents, name, rawDescription: null, merchantId: 1, providerId, providerName: "Oxxo", accountName: "Bbva" });

function build(rows?: UncategorizedTransaction[]) {
  const updates: Array<{ id: number; categoryId: number | null }> = [];
  const confirmed: Array<[number, string]> = [];
  const data = rows ?? [tx(1, 5, -100), tx(2, 5, -200), tx(3, 6, -300), tx(4, 5, 400)];
  const useCase = new CategorizeProviderUseCase(
    { listStandardUncategorized: async () => data, listOwnerNames: async () => ["Rafael"], listKnownProviderCategories: async () => [] },
    { list: async () => [{ id: 9, classification: "expense" }, { id: 10, classification: "income" }] } as never,
    { executeMany: async (inputs: Array<{ id: number; categoryId: number | null }>) => { updates.push(...inputs); } } as never,
    { confirmSingle: async (_family: number, id: number, kind: string) => { confirmed.push([id, kind]); } },
  );
  return { useCase, updates, confirmed };
}

test("aplica la categoría a todo lo del comercio y mismo tipo, y a nada más", async () => {
  const { useCase, updates } = build();
  const result = await useCase.execute(1, { providerId: 5, flow: "expense", hintKey: "-", decision: { categoryId: 9 } });
  assert.equal(result.updated, 2);
  assert.deepEqual(updates.map((u) => u.id), [1, 2]);
});

test("rechaza una categoría de otro tipo, inexistente o un comercio sin pendientes", async () => {
  const { useCase, updates } = build();
  await assert.rejects(() => useCase.execute(1, { providerId: 5, flow: "expense", hintKey: "-", decision: { categoryId: 10 } }), InvalidCategoryReviewError);
  await assert.rejects(() => useCase.execute(1, { providerId: 5, flow: "expense", hintKey: "-", decision: { categoryId: 99 } }), InvalidCategoryReviewError);
  await assert.rejects(() => useCase.execute(1, { providerId: 77, flow: "expense", hintKey: "-", decision: { categoryId: 9 } }), InvalidCategoryReviewError);
  assert.deepEqual(updates, []);
});

test("marcar como transferencia solo toca el subgrupo de esa naturaleza y no pone categoría", async () => {
  const rows = [tx(1, 5, -100, "SPEI ENVIADO NU MEXICO"), tx(2, 5, -200, "SPEI ENVIADO NU MEXICO – tdc"), tx(3, 5, -300, "SPEI ENVIADO NU MEXICO")];
  const { useCase, updates, confirmed } = build(rows);
  const result = await useCase.execute(1, { providerId: 5, flow: "expense", hintKey: "unclear:-", decision: { transferKind: "transfer" } });
  assert.equal(result.updated, 2);
  assert.deepEqual(confirmed, [[1, "transfer"], [3, "transfer"]]);
  assert.deepEqual(updates, []);
});

test("un ingreso no puede ser pago de tarjeta ni de deuda", async () => {
  const { useCase, confirmed } = build([tx(1, 5, 5000, "SPEI RECIBIDO NU MEXICO")]);
  await assert.rejects(() => useCase.execute(1, { providerId: 5, flow: "income", hintKey: "unclear:-", decision: { transferKind: "cc_payment" } }), InvalidCategoryReviewError);
  assert.deepEqual(confirmed, []);
});
