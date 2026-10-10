import assert from "node:assert/strict";
import { test } from "node:test";
import type { UncategorizedTransaction } from "@/domain/categories/ports";
import { RelearnCategoriesUseCase } from "./relearnCategories";

const tx = (over: Partial<UncategorizedTransaction>): UncategorizedTransaction => ({
  id: 1, accountId: 1, date: "2026-09-01", amountCents: -1200, name: "VA Y VEN", rawDescription: null, merchantId: 10, providerId: 100, providerName: "Va y Ven", accountName: "Bbva", ...over,
});

function build(rows: UncategorizedTransaction[], opts: { learnFor?: Record<number, { categoryId: number; share: number; sample: number }>; peek?: number | null } = {}) {
  const updates: unknown[] = [];
  const linked: Array<[number, number]> = [];
  const useCase = new RelearnCategoriesUseCase(
    { listStandardUncategorized: async () => rows, listOwnerNames: async () => [], listKnownProviderCategories: async () => [] },
    { peekProviderId: async () => opts.peek ?? null, execute: async () => ({ id: 55, providerId: 100 }) } as never,
    { setTransactionMerchant: async (t, m) => { linked.push([t, m]); } },
    { execute: async ({ providerId }: { providerId: number | null }) => (providerId != null ? opts.learnFor?.[providerId] ?? null : null) } as never,
    { execute: async (input: unknown) => { updates.push(input); } } as never,
  );
  return { useCase, updates, linked };
}

test("vista previa: reporta qué asignaría y no escribe nada", async () => {
  const { useCase, updates, linked } = build([tx({ id: 1 }), tx({ id: 2, merchantId: null, providerId: null })], { learnFor: { 100: { categoryId: 7, share: 1, sample: 9 } }, peek: 100 });
  const report = await useCase.execute({ familyId: 1, apply: false });
  assert.equal(report.learned.length, 2);
  assert.equal(report.learned[1].merchantWasMissing, true);
  assert.deepEqual(updates, []);
  assert.deepEqual(linked, []);
});

test("aplicar: liga el comercio faltante y guarda la categoría", async () => {
  const { useCase, updates, linked } = build([tx({ id: 2, merchantId: null, providerId: null })], { learnFor: { 100: { categoryId: 7, share: 1, sample: 3 } } });
  const report = await useCase.execute({ familyId: 1, apply: true });
  assert.equal(report.learned.length, 1);
  assert.deepEqual(linked, [[2, 55]]);
  assert.equal((updates[0] as { categoryId: number }).categoryId, 7);
});

test("sin proveedor o sin evidencia no toca nada y lo cuenta aparte", async () => {
  const { useCase, updates } = build([tx({ id: 1, providerId: 200 }), tx({ id: 2, merchantId: null, providerId: null })], { peek: null });
  const report = await useCase.execute({ familyId: 1, apply: false });
  assert.equal(report.withoutEvidence, 1);
  assert.equal(report.withoutProvider, 1);
  assert.equal(report.learned.length, 0);
  assert.deepEqual(updates, []);
  assert.equal(report.pending, 2);
});

test("los proveedores excluidos no se ligan ni se categorizan", async () => {
  const { useCase, updates, linked } = build([tx({ id: 1, providerId: 126 }), tx({ id: 2, merchantId: null, providerId: null })], { learnFor: { 126: { categoryId: 7, share: 1, sample: 2 } }, peek: 126 });
  const report = await useCase.execute({ familyId: 1, apply: true, excludeProviderIds: [126] });
  assert.equal(report.excluded, 2);
  assert.equal(report.learned.length, 0);
  assert.deepEqual(updates, []);
  assert.deepEqual(linked, []);
});
