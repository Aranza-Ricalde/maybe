import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCategoryReviewQueue, type ReviewQueueRow } from "./reviewQueue";

const row = (over: Partial<ReviewQueueRow>): ReviewQueueRow => ({ amountCents: -10_000, name: "OXXO MONARCA", date: "2026-03-01", providerId: 1, providerName: "Oxxo", ...over });

test("agrupa por comercio, suma montos y ordena por monto", () => {
  const queue = buildCategoryReviewQueue([row({}), row({ amountCents: -5_000, date: "2026-04-01" }), row({ providerId: 2, providerName: "Chedraui", amountCents: -200_000 })]);
  assert.deepEqual(queue.map((g) => [g.providerName, g.count, g.totalCents]), [["Chedraui", 1, 200_000], ["Oxxo", 2, 15_000]]);
  assert.equal(queue[1].lastDate, "2026-04-01");
});

test("separa gastos de ingresos del mismo comercio", () => {
  const queue = buildCategoryReviewQueue([row({}), row({ amountCents: 4_000 })]);
  assert.deepEqual(queue.map((g) => g.flow).sort(), ["expense", "income"]);
});

test("ignora lo que no tiene comercio, junta nombres de ejemplo y respeta el límite", () => {
  const rows = [row({ providerId: null }), row({ name: "A" }), row({ name: "B" }), row({ name: "A" }), row({ name: "C" }), row({ name: "D" })];
  const [group] = buildCategoryReviewQueue(rows);
  assert.equal(group.count, 5);
  assert.deepEqual(group.sampleNames, ["A", "B", "C"]);
  assert.equal(buildCategoryReviewQueue([row({}), row({ providerId: 2 }), row({ providerId: 3 })], [], 2).length, 2);
});

test("separa en el mismo comercio las transferencias de distinta naturaleza", () => {
  const nu = { providerId: 9, providerName: "Nu México" };
  const queue = buildCategoryReviewQueue([
    row({ ...nu, name: "SPEI ENVIADO NU MEXICO – tdc", amountCents: -50_000 }),
    row({ ...nu, name: "SPEI ENVIADO NU MEXICO", amountCents: -10_000 }),
    row({ ...nu, name: "SPEI ENVIADO NU MEXICO", amountCents: -20_000 }),
  ]);
  assert.deepEqual(queue.map((g) => [g.hint?.nature, g.count]), [["card", 1], ["unclear", 2]]);
});

test("cada grupo trae sus movimientos, del más reciente al más antiguo", () => {
  const [group] = buildCategoryReviewQueue([
    row({ id: 1, date: "2026-01-05", accountName: "Bbva" }),
    row({ id: 2, date: "2026-03-09", accountName: "Nu Débito" }),
    row({ id: 3, date: "2026-02-01", accountName: "Bbva" }),
  ]);
  assert.deepEqual(group.movements.map((m) => m.id), [2, 3, 1]);
  assert.equal(group.movements[0].accountName, "Nu Débito");
});
