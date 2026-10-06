import assert from "node:assert/strict";
import { test } from "node:test";
import type { InsightExpense } from "@/domain/insights/rules";
import { rankMerchants, smallExpenseSummary, subscriptionCategoryIds, subscriptionSummary, type MerchantSpendRow } from "./rules";

const TODAY = "2026-10-12";
const e = (id: number, date: string, amountCents: number, categoryName: string | null, name = "x"): InsightExpense => ({ id, date, name, amountCents, accountId: 1, categoryId: categoryName ? id : null, categoryName });

test("el ejemplo del documento: pequeños gastos por categoría y su total", () => {
  const result = smallExpenseSummary(
    [
      e(1, "2026-09-03", -9_000, "Snacks"), e(2, "2026-09-10", -30_000 / 10, "Snacks"), // 90 + 30 = 120
      e(3, "2026-09-05", -12_000, "Cafés"),
      e(4, "2026-09-07", -14_000, "Delivery"), e(5, "2026-09-20", -13_000, "Delivery"),
      e(6, "2026-09-09", -500_000, "Vivienda"), // grande: no cuenta
    ],
    TODAY,
  )!;
  assert.equal(result.month, "2026-09-01");
  assert.equal(result.totalCents, 9_000 + 3_000 + 12_000 + 14_000 + 13_000);
  assert.equal(result.count, 5);
  assert.deepEqual(result.groups.map((g) => [g.name, g.totalCents]), [["Delivery", 27_000], ["Cafés", 12_000], ["Snacks", 12_000]]);
  assert.equal(result.shareOfSpend, 51_000 / 551_000);
});

test("compara con el mes anterior y no cuenta ni ingresos ni el mes en curso", () => {
  const result = smallExpenseSummary(
    [e(1, "2026-09-03", -5_000, "Cafés"), e(2, "2026-08-03", -3_000, "Cafés"), e(3, "2026-10-02", -9_000, "Cafés"), e(4, "2026-09-04", 5_000, "Cafés")],
    TODAY,
  )!;
  assert.equal(result.totalCents, 5_000);
  assert.equal(result.previousTotalCents, 3_000);
});

test("sin gastos pequeños en el último mes completo, no hay resumen", () => {
  assert.equal(smallExpenseSummary([e(1, "2026-09-03", -500_000, "Vivienda")], TODAY), null);
  assert.equal(smallExpenseSummary([], TODAY), null);
});

test("con muchas categorías, las menores se agrupan en 'Otros' sin perder dinero", () => {
  const rows = Array.from({ length: 9 }, (_, i) => e(i + 1, "2026-09-03", -(1_000 + i * 100), `Cat ${i}`));
  const result = smallExpenseSummary(rows, TODAY)!;
  assert.equal(result.groups.length, 7);
  assert.equal(result.groups.at(-1)?.name, "Otros");
  assert.equal(result.groups.reduce((s, g) => s + g.totalCents, 0), result.totalCents);
});

const row = (merchant: string, totalCents: number, count = 1, categoryId: number | null = 1): MerchantSpendRow => ({ merchant, categoryId, totalCents, count });

test("los comercios se ordenan por lo que consumen y un comercio suma todas sus categorías", () => {
  const ranked = rankMerchants([row("Uber", 10_000, 3, 1), row("Uber", 5_000, 1, 2), row("Oxxo", 12_000, 4), row("Netflix", 20_000, 3)]);
  assert.deepEqual(ranked.map((m) => [m.merchant, m.totalCents, m.count]), [["Netflix", 20_000, 3], ["Uber", 15_000, 4], ["Oxxo", 12_000, 4]]);
  assert.equal(Math.round(ranked[0].shareOfSpend * 100), 43);
  assert.equal(rankMerchants([row("a", 1), row("b", 2), row("c", 3)], 2).length, 2);
});

test("lo que no es un comercio (rieles de pago, palabras genéricas, sin identificar) no entra, pero cuenta en el total", () => {
  const ranked = rankMerchants([row("SPEI", 50_000), row("Transferencia", 40_000), row("Renta", 90_000), row("Sin identificar", 10_000), row("Oxxo", 10_000)]);
  assert.deepEqual(ranked.map((m) => m.merchant), ["Oxxo"]);
  assert.equal(ranked[0].shareOfSpend, 10_000 / 200_000);
});

test("las suscripciones son las categorías con ese nombre y sus subcategorías", () => {
  const ids = subscriptionCategoryIds([
    { id: 1, name: "Ocio", parentId: null },
    { id: 2, name: "Suscripciones y streaming", parentId: 1 },
    { id: 3, name: "Música", parentId: 2 },
    { id: 4, name: "Salidas", parentId: 1 },
    { id: 5, name: "SUSCRIPCIONES", parentId: null },
  ]);
  assert.deepEqual([...ids].sort(), [2, 3, 5]);
});

test("el costo de suscripciones es mensual promedio, por servicio, y anual", () => {
  const ids = new Set([2, 3]);
  const summary = subscriptionSummary([row("Netflix", 59_700, 3, 2), row("Spotify", 38_700, 3, 3), row("Oxxo", 90_000, 5, 9)], ids, 3)!;
  assert.deepEqual(summary.services, [{ merchant: "Netflix", monthlyCents: 19_900 }, { merchant: "Spotify", monthlyCents: 12_900 }]);
  assert.equal(summary.monthlyCents, 32_800);
  assert.equal(summary.yearlyCents, 32_800 * 12);
});

test("sin gasto en suscripciones o sin meses, no hay resumen", () => {
  assert.equal(subscriptionSummary([row("Oxxo", 100, 1, 9)], new Set([2]), 3), null);
  assert.equal(subscriptionSummary([row("Netflix", 100, 1, 2)], new Set([2]), 0), null);
});
