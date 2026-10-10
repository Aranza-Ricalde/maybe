import assert from "node:assert/strict";
import { test } from "node:test";
import type { CategoryClassifierInput } from "@/domain/captures/ports";
import type { UncategorizedTransaction } from "@/domain/categories/ports";
import { ClassifyPendingWithAiUseCase } from "./classifyPendingWithAi";

const tx = (id: number, providerId: number, providerName: string, amountCents: number, name: string): UncategorizedTransaction => ({
  id, accountId: 1, date: "2026-03-01", amountCents, name, rawDescription: null, merchantId: 1, providerId, providerName, accountName: "Bbva",
});

function build(opts: { rows: UncategorizedTransaction[]; answer: (input: CategoryClassifierInput) => unknown; asked?: number[]; enabled?: boolean }) {
  const inputs: CategoryClassifierInput[] = [];
  const applied: Array<{ providerId: number; categoryId: number }> = [];
  const recorded: Array<[number, string, string]> = [];
  const useCase = new ClassifyPendingWithAiUseCase(
    {
      listStandardUncategorized: async () => opts.rows,
      listOwnerNames: async () => ["Rafael"],
      listKnownProviderCategories: async () => [{ providerName: "Didi", categoryId: 1, categoryName: "Transporte", count: 9 }],
    },
    { list: async () => [{ id: 1, name: "Transporte", classification: "expense" }, { id: 2, name: "Café y snacks", classification: "expense" }, { id: 3, name: "Reembolso", classification: "income" }, { id: 4, name: "Ahorro", classification: "expense" }, { id: 5, name: "Préstamos y deudas", classification: "expense" }] } as never,
    opts.enabled === false ? undefined : ({ classify: async (input: CategoryClassifierInput) => { inputs.push(input); const a = opts.answer(input); if (a instanceof Error) throw a; return a; } } as never),
    { execute: async (_f: number, input: { providerId: number; decision: { categoryId: number } }) => { applied.push({ providerId: input.providerId, categoryId: input.decision.categoryId }); return { updated: 1 }; } } as never,
    { listDecidedTransactionIds: async () => opts.asked ?? [], recordDecision: async (_f: number, id: number, topic: string, decision: string) => { recorded.push([id, topic, decision]); } },
  );
  return { useCase, inputs, applied, recorded };
}

test("con confianza alta aplica la categoría al comercio y le pasa a la IA lo ya aprendido", async () => {
  const { useCase, inputs, applied, recorded } = build({ rows: [tx(1, 7, "Oxxo", -5000, "OXXO MONARCA"), tx(2, 7, "Oxxo", -3000, "OXXO CUN")], answer: () => ({ categoryId: 2, confidence: "high" }) });
  const report = await useCase.execute(1);
  assert.deepEqual(applied, [{ providerId: 7, categoryId: 2 }]);
  assert.equal(report.applied[0].categoryName, "Café y snacks");
  assert.deepEqual(inputs[0].knownExamples, [{ description: "Didi", categoryName: "Transporte" }]);
  assert.deepEqual(inputs[0].categories.map((c) => c.id), [1, 2, 4, 5]);
  assert.deepEqual(recorded, []);
});

test("si la IA no lo reconoce con certeza lo recuerda para no volver a preguntar y queda para el usuario", async () => {
  const { useCase, applied, recorded } = build({ rows: [tx(1, 7, "Brist", -199000, "BRIST")], answer: () => ({ categoryId: 2, confidence: "medium" }) });
  const report = await useCase.execute(1);
  assert.deepEqual(applied, []);
  assert.equal(report.unknown.length, 1);
  assert.deepEqual(recorded, [[1, "category_ai", "ai_unknown"]]);
});

test("no vuelve a preguntar por lo que la IA ya dijo no saber", async () => {
  const { useCase, inputs } = build({ rows: [tx(1, 7, "Brist", -199000, "BRIST")], answer: () => null, asked: [1] });
  await useCase.execute(1);
  assert.equal(inputs.length, 0);
});

test("las transferencias sin pistas no se le preguntan a la IA, pero las de un tercero sí", async () => {
  const { useCase, inputs } = build({
    rows: [tx(1, 8, "Nu México", -600000, "SPEI ENVIADO NU MEXICO"), tx(2, 9, "Lavandería", -27800, "PAGO CUENTA DE TERCERO – lavanderia"), tx(3, 10, "Arcus", -83000, "SPEI ENVIADO ARCUS FI – tdc")],
    answer: () => ({ categoryId: 2, confidence: "high" }),
  });
  await useCase.execute(1);
  assert.equal(inputs.length, 1);
  assert.match(inputs[0].description, /Lavandería/);
});

test("un fallo de la IA no se recuerda como 'no supo' (se reintenta después) y sin IA no hace nada", async () => {
  const failing = build({ rows: [tx(1, 7, "Oxxo", -5000, "OXXO")], answer: () => new Error("503") });
  const report = await failing.useCase.execute(1);
  assert.equal(report.failed, 1);
  assert.deepEqual(failing.recorded, []);

  const off = build({ rows: [tx(1, 7, "Oxxo", -5000, "OXXO")], answer: () => null, enabled: false });
  assert.equal(off.useCase.enabled, false);
  assert.deepEqual(await off.useCase.execute(1), { applied: [], unknown: [], failed: 0 });
});

test("vista previa: no aplica ni recuerda nada", async () => {
  const { useCase, applied, recorded } = build({ rows: [tx(1, 7, "Oxxo", -5000, "OXXO")], answer: () => ({ categoryId: 2, confidence: "high" }) });
  const report = await useCase.execute(1, { apply: false });
  assert.equal(report.applied.length, 1);
  assert.deepEqual(applied, []);
  assert.deepEqual(recorded, []);
});

test("ahorro y préstamos no los decide la IA sola: quedan para el usuario aunque tenga confianza alta", async () => {
  for (const categoryId of [4, 5]) {
    const { useCase, applied, recorded } = build({ rows: [tx(1, 7, "F Ahorro", -50000, "F AHORRO")], answer: () => ({ categoryId, confidence: "high" }) });
    const report = await useCase.execute(1);
    assert.deepEqual(applied, []);
    assert.equal(report.unknown.length, 1);
    assert.deepEqual(recorded, [[1, "category_ai", "ai_unknown"]]);
  }
});
