import assert from "node:assert/strict";
import { test } from "node:test";
import type { GoalProjection } from "@/domain/goals/projection";
import { buildCategoryStats, type MonthlyCategorySpend, type StatCategory } from "@/domain/categoryStats/rules";
import {
  buildInsights,
  categoryChangeInsights,
  categoryStreakInsights,
  duplicateInsights,
  fastGrowthInsights,
  goalInsights,
  netWorthInsight,
  recurringPriceInsights,
  savingsInsights,
  suspectedTransfersInsight,
  uncategorizedInsight,
  unusualExpenseInsights,
  type InsightExpense,
} from "./rules";

const TODAY = "2026-10-12";
const CATEGORIES: StatCategory[] = [
  { id: 1, name: "Transporte", parentId: null },
  { id: 2, name: "Ocio", parentId: null },
  { id: 3, name: "Vivienda", parentId: null },
];
const spend = (categoryId: number, month: string, spentCents: number): MonthlyCategorySpend => ({ categoryId, month, spentCents, count: 1 });
const statsOf = (spendRows: MonthlyCategorySpend[]) => buildCategoryStats({ categories: CATEGORIES, today: TODAY, spend: spendRows });

test("un gasto de categoría que sube respecto al promedio de los meses anteriores es un cambio importante", () => {
  const stats = statsOf([
    spend(1, "2026-06-01", 100_000), spend(1, "2026-07-01", 100_000), spend(1, "2026-08-01", 100_000), spend(1, "2026-09-01", 150_000),
  ]);
  const [insight] = categoryChangeInsights(stats);
  assert.equal(insight.tone, "change");
  assert.match(insight.message, /Transporte subió \$500 en septiembre \(\+50%\)/);
  assert.equal(insight.href, "/transactions?categoryId=1&from=2026-09-01&to=2026-09-30");
});

test("lo que baja de verdad es positivo", () => {
  const stats = statsOf([spend(2, "2026-06-01", 200_000), spend(2, "2026-07-01", 200_000), spend(2, "2026-08-01", 200_000), spend(2, "2026-09-01", 100_000)]);
  const [insight] = categoryChangeInsights(stats);
  assert.equal(insight.tone, "positive");
  assert.match(insight.message, /Ocio bajó \$1,000/);
});

test("cambios pequeños (menos de $300 o de 15 %) no son noticia", () => {
  const small = statsOf([spend(1, "2026-06-01", 100_000), spend(1, "2026-07-01", 100_000), spend(1, "2026-08-01", 100_000), spend(1, "2026-09-01", 110_000)]);
  assert.deepEqual(categoryChangeInsights(small), []);
  const tiny = statsOf([spend(1, "2026-06-01", 10_000), spend(1, "2026-07-01", 10_000), spend(1, "2026-08-01", 10_000), spend(1, "2026-09-01", 20_000)]);
  assert.deepEqual(categoryChangeInsights(tiny), []);
});

test("con menos de 3 meses completos no hay base para comparar", () => {
  assert.deepEqual(categoryChangeInsights(statsOf([spend(1, "2026-08-01", 100_000), spend(1, "2026-09-01", 300_000)])), []);
});

test("una categoría que sube 3 meses seguidos llama la atención (el ejemplo de principios.md)", () => {
  const stats = statsOf([spend(1, "2026-06-01", 100_000), spend(1, "2026-07-01", 120_000), spend(1, "2026-08-01", 140_000), spend(1, "2026-09-01", 170_000)]);
  const [insight] = categoryStreakInsights(stats);
  assert.equal(insight.tone, "attention");
  assert.match(insight.message, /Transporte lleva 3 meses consecutivos aumentando/);
});

test("una racha interrumpida no cuenta", () => {
  const stats = statsOf([spend(1, "2026-06-01", 100_000), spend(1, "2026-07-01", 140_000), spend(1, "2026-08-01", 130_000), spend(1, "2026-09-01", 170_000)]);
  assert.deepEqual(categoryStreakInsights(stats), []);
});

test("el ahorro: retiros, bajada fuerte de la tasa y subida fuerte", () => {
  assert.equal(savingsInsights({ rate: 0.05, previousRate: 0.25, savedCents: 100_000 })[0].id, "savings-rate-down");
  assert.equal(savingsInsights({ rate: 0.3, previousRate: 0.1, savedCents: 100_000 })[0].tone, "positive");
  assert.equal(savingsInsights({ rate: 0.2, previousRate: 0.15, savedCents: 100_000 }).length, 0);
  assert.match(savingsInsights({ rate: null, previousRate: null, savedCents: -250_000 })[0].message, /Retiraste \$2,500/);
});

test("el patrimonio solo se menciona si cambió de forma apreciable", () => {
  assert.equal(netWorthInsight(100).length, 0);
  assert.equal(netWorthInsight(900_000)[0].tone, "positive");
  assert.equal(netWorthInsight(-900_000)[0].tone, "change");
});

test("movimientos sin categoría y posibles transferencias se avisan una sola vez cada uno", () => {
  assert.equal(uncategorizedInsight({ count: 0, totalCents: 0 }).length, 0);
  assert.match(uncategorizedInsight({ count: 3, totalCents: 120_000 })[0].message, /Tienes 3 gastos sin categoría/);
  assert.equal(suspectedTransfersInsight(0).length, 0);
  assert.equal(suspectedTransfersInsight(2).length, 1);
});

const expense = (over: Partial<InsightExpense> & { id: number }): InsightExpense => ({ date: "2026-10-05", name: "Netflix", amountCents: -19_900, accountId: 1, categoryId: 2, categoryName: "Ocio", ...over });

test("el mismo gasto dos veces en pocos días es un posible duplicado; cada movimiento se usa una vez", () => {
  const result = duplicateInsights([expense({ id: 1, date: "2026-10-04" }), expense({ id: 2, date: "2026-10-05" }), expense({ id: 3, date: "2026-10-05" })], TODAY);
  assert.equal(result.length, 1);
  assert.match(result[0].message, /Posible gasto duplicado: “Netflix” por \$199/);
});

test("montos chicos, cuentas distintas o fechas lejanas no son duplicados", () => {
  assert.equal(duplicateInsights([expense({ id: 1, amountCents: -3_000 }), expense({ id: 2, amountCents: -3_000 })], TODAY).length, 0);
  assert.equal(duplicateInsights([expense({ id: 1 }), expense({ id: 2, accountId: 9 })], TODAY).length, 0);
  assert.equal(duplicateInsights([expense({ id: 1, date: "2026-10-01" }), expense({ id: 2, date: "2026-10-08" })], TODAY).length, 0);
});

test("un gasto varias veces mayor a lo habitual de su categoría es inusual", () => {
  const history = [1, 2, 3, 4, 5].map((i) => expense({ id: 100 + i, date: `2026-09-0${i}`, name: "Tacos", amountCents: -20_000 }));
  const big = expense({ id: 1, date: "2026-10-08", name: "Cena", amountCents: -150_000 });
  const [insight] = unusualExpenseInsights([...history, big], TODAY);
  assert.equal(insight.tone, "change");
  assert.match(insight.message, /Gasto inusualmente alto: “Cena” por \$1,500 en Ocio/);
  assert.match(insight.detail as string, /\$200/);
});

test("un gasto que se parece a otros anteriores con el mismo nombre no es inusual (la gasolina de siempre)", () => {
  const trips = [1, 2, 3, 4, 5].map((i) => expense({ id: 100 + i, date: `2026-09-0${i}`, name: "Uber", amountCents: -4_000, categoryId: 1, categoryName: "Transporte" }));
  const earlierGas = expense({ id: 200, date: "2026-08-20", name: "gasolina", amountCents: -59_975, categoryId: 1, categoryName: "Transporte" });
  const gas = expense({ id: 1, date: "2026-10-01", name: "Gasolina", amountCents: -60_975, categoryId: 1, categoryName: "Transporte" });
  assert.equal(unusualExpenseInsights([...trips, earlierGas, gas], TODAY).length, 0);
  // La misma compra de siempre registrada en otra categoría (subcategoría) tampoco es inusual.
  const otherCategory = expense({ id: 201, date: "2026-08-20", name: "gasolina", amountCents: -59_975, categoryId: 9, categoryName: "Auto" });
  assert.equal(unusualExpenseInsights([...trips, otherCategory, gas], TODAY).length, 0);
  // Si se repite DESPUÉS, la primera tampoco era inusual: ya es lo normal.
  const first = expense({ id: 2, date: "2026-09-15", name: "gasolina", amountCents: -59_975, categoryId: 1, categoryName: "Transporte" });
  assert.equal(unusualExpenseInsights([...trips, first, gas], TODAY).length, 0);
  // Sin el antecedente, la misma compra sí destaca frente a los viajes de $40.
  assert.equal(unusualExpenseInsights([...trips, gas], TODAY).length, 1);
});

test("sin historial suficiente o por debajo del mínimo no se marca como inusual", () => {
  const few = [1, 2].map((i) => expense({ id: 100 + i, date: `2026-09-0${i}`, amountCents: -20_000 }));
  assert.equal(unusualExpenseInsights([...few, expense({ id: 1, date: "2026-10-08", amountCents: -150_000 })], TODAY).length, 0);
  const history = [1, 2, 3, 4, 5].map((i) => expense({ id: 100 + i, date: `2026-09-0${i}`, amountCents: -5_000 }));
  assert.equal(unusualExpenseInsights([...history, expense({ id: 1, date: "2026-10-08", amountCents: -30_000 })], TODAY).length, 0);
});

test("un recurrente pagado por más de lo esperado se avisa (el ejemplo: Internet $300 arriba)", () => {
  const [insight] = recurringPriceInsights([{ name: "Internet Casa", date: "2026-10-01", expectedAmountCents: -49_900, actualAmountCents: -79_900 }], TODAY);
  assert.match(insight.message, /Tu pago de Internet Casa fue \$300 superior a lo habitual/);
  assert.equal(recurringPriceInsights([{ name: "Luz", date: "2026-10-01", expectedAmountCents: -45_000, actualAmountCents: -46_000 }], TODAY).length, 0);
  assert.equal(recurringPriceInsights([{ name: "Luz", date: "2026-10-01", expectedAmountCents: -45_000, actualAmountCents: null }], TODAY).length, 0);
});

test("la lista final va de lo más importante a lo menos y respeta el tope por tono", () => {
  const stats = statsOf([
    spend(1, "2026-06-01", 100_000), spend(1, "2026-07-01", 120_000), spend(1, "2026-08-01", 140_000), spend(1, "2026-09-01", 300_000),
    spend(2, "2026-06-01", 200_000), spend(2, "2026-07-01", 200_000), spend(2, "2026-08-01", 200_000), spend(2, "2026-09-01", 100_000),
  ]);
  const result = buildInsights({
    today: TODAY,
    stats,
    savings: { rate: 0.2, previousRate: 0.2, savedCents: 10_000 },
    netWorthDeltaCents: 0,
    uncategorized: { count: 2, totalCents: 50_000 },
    suspectedTransfers: 0,
    expenses: [],
    occurrences: [],
    goals: [],
  });
  assert.deepEqual(result.map((i) => i.tone), ["change", "attention", "attention", "positive"]);
  assert.ok(result.every((i, idx, arr) => idx === 0 || ["change", "attention", "positive"].indexOf(arr[idx - 1].tone) <= ["change", "attention", "positive"].indexOf(i.tone)));
});

test("sin nada que contar, no se inventa nada", () => {
  const result = buildInsights({ today: TODAY, stats: statsOf([]), savings: { rate: null, previousRate: null, savedCents: 0 }, netWorthDeltaCents: 0, uncategorized: { count: 0, totalCents: 0 }, suspectedTransfers: 0, expenses: [], occurrences: [], goals: [] });
  assert.deepEqual(result, []);
});

const goalProjection = (over: Partial<GoalProjection>): GoalProjection => ({ achieved: false, remainingCents: 700_000, dailyPaceCents: 3_000, monthlyPaceCents: 90_000, etaDays: 49, etaDate: "2026-11-24", onTrack: null, neededMonthlyCents: null, ...over });

test("🎯 el ejemplo de principios.md: al ritmo actual alcanzarías tu meta en unas 7 semanas", () => {
  const [insight] = goalInsights([{ name: "Mudanza", targetDate: null, projection: goalProjection({}) }]);
  assert.equal(insight.tone, "goal");
  assert.match(insight.message, /Al ritmo actual alcanzarías tu meta “Mudanza” en unas 7 semanas/);
});

test("una meta que con su fecha objetivo no llega se marca como atención con lo que faltaría ahorrar", () => {
  const [insight] = goalInsights([{ name: "Viaje", targetDate: "2026-12-01", projection: goalProjection({ onTrack: false, neededMonthlyCents: 250_000 }) }]);
  assert.equal(insight.tone, "attention");
  assert.match(insight.detail as string, /harían falta \$2,500 al mes/);
});

test("metas cumplidas o sin avance no generan observación", () => {
  assert.equal(goalInsights([{ name: "A", targetDate: null, projection: goalProjection({ achieved: true, etaDays: null, etaDate: null }) }]).length, 0);
  assert.equal(goalInsights([{ name: "B", targetDate: null, projection: goalProjection({ etaDays: null, etaDate: null, dailyPaceCents: 0 }) }]).length, 0);
});

test("una categoría que salta 50 % o más de un mes al siguiente es de atención, con el salto a la vista", () => {
  const stats = statsOf([spend(1, "2026-08-01", 100_000), spend(1, "2026-09-01", 180_000)]);
  const [insight] = fastGrowthInsights(stats);
  assert.equal(insight.tone, "attention");
  assert.match(insight.message, /Transporte creció 80% de agosto a septiembre/);
  assert.match(insight.detail as string, /De \$1,000 a \$1,800|Pasó de \$1,000 a \$1,800/);
});

test("un salto chico (en porcentaje o en pesos) o sin mes anterior no cuenta como crecimiento rápido", () => {
  assert.equal(fastGrowthInsights(statsOf([spend(1, "2026-08-01", 100_000), spend(1, "2026-09-01", 140_000)])).length, 0); // +40 %
  assert.equal(fastGrowthInsights(statsOf([spend(1, "2026-08-01", 1_000), spend(1, "2026-09-01", 9_000)])).length, 0); // +800 % pero solo $80
  assert.equal(fastGrowthInsights(statsOf([spend(1, "2026-09-01", 900_000)])).length, 0);
});

test("no repite una categoría que ya salió como cambio importante", () => {
  const stats = statsOf([spend(1, "2026-08-01", 100_000), spend(1, "2026-09-01", 180_000)]);
  assert.equal(fastGrowthInsights(stats, new Set([1])).length, 0);
});
