import assert from "node:assert/strict";
import { test } from "node:test";
import type { MerchantSpendRow } from "./rules";
import { InvalidSubscriptionMergeError, assertValidSubscriptionMerge, subscriptionAliasKey, subscriptionCategoryIds, subscriptionSummary, type SubscriptionAlias } from "./subscriptions";

const IDS = new Set([7]);
const charge = (merchant: string, month: string, totalCents: number, count = 1): MerchantSpendRow => ({ merchant, identified: false, categoryId: 7, month, totalCents, count });

const CARGOS_REALES = [
  charge("Microsoft", "2026-07", 48_720, 2),
  charge("Xbox Game Pass", "2026-08", 21_900),
  charge("Xbox suscription", "2026-09", 21_900),
  charge("Apple", "2026-07", 13_900, 2),
  charge("Amazon Prime", "2026-08", 9_900),
  charge("prime video", "2026-09", 9_900),
];

test("las suscripciones son las categorías con ese nombre y sus subcategorías", () => {
  const ids = subscriptionCategoryIds([{ id: 1, name: "Suscripciones y streaming", parentId: null }, { id: 2, name: "Música", parentId: 1 }, { id: 3, name: "Comida", parentId: null }]);
  assert.deepEqual([...ids].sort(), [1, 2]);
});

test("el monto mensual de un servicio es el cobro típico (mediana de los meses con cobro), no el total entre 3", () => {
  const summary = subscriptionSummary([charge("Netflix", "2026-08", 22_900), charge("Netflix", "2026-09", 22_900), charge("Netflix", "2026-07", 22_900)], IDS, 3)!;
  assert.deepEqual(summary.services.map((s) => [s.name, s.monthlyCents, s.monthsWithCharge]), [["Netflix", 22_900, 3]]);
  assert.equal(summary.yearlyCents, 22_900 * 12);
});

test("un servicio con un solo cobro en la ventana cuenta ese cobro como su mensualidad, no la tercera parte", () => {
  const summary = subscriptionSummary([charge("Spotify", "2026-09", 12_900)], IDS, 3)!;
  assert.equal(summary.services[0].monthlyCents, 12_900);
  assert.equal(summary.services[0].monthsWithCharge, 1);
});

test("una compra extra en un mes no infla la mensualidad: manda la mediana", () => {
  const summary = subscriptionSummary([charge("Xbox", "2026-07", 48_720, 2), charge("Xbox", "2026-08", 21_900), charge("Xbox", "2026-09", 21_900)], IDS, 3)!;
  assert.equal(summary.monthlyCents, 21_900);
  assert.equal(summary.services[0].chargeCount, 4);
});

test("fusionar nombres distintos suma sus cobros por mes: Xbox = $219 y Amazon Prime vía Apple = $99, como en el ejemplo real", () => {
  const aliases: SubscriptionAlias[] = [
    ...["Microsoft", "Xbox Game Pass", "Xbox suscription"].map((m) => ({ aliasKey: subscriptionAliasKey(m), groupId: 1, groupName: "Xbox Game Pass" })),
    ...["Apple", "Amazon Prime", "prime video"].map((m) => ({ aliasKey: subscriptionAliasKey(m), groupId: 2, groupName: "Amazon Prime" })),
  ];
  const summary = subscriptionSummary(CARGOS_REALES, IDS, 3, aliases)!;
  assert.deepEqual(summary.services.map((s) => [s.name, s.monthlyCents]), [["Xbox Game Pass", 21_900], ["Amazon Prime", 9_900]]);
  assert.equal(summary.monthlyCents, 31_800);
  assert.deepEqual(summary.services[0].members, ["Microsoft", "Xbox Game Pass", "Xbox suscription"]);
  assert.equal(summary.suggestions.length, 0);
});

test("sin fusionar, el total de los datos reales queda inflado y la app sugiere los pares con mismo monto que nunca coinciden en un mes", () => {
  const summary = subscriptionSummary(CARGOS_REALES, IDS, 3)!;
  assert.deepEqual(summary.suggestions.map((s) => s.names.slice().sort()), [["Xbox Game Pass", "Xbox suscription"], ["Amazon Prime", "prime video"]]);
  assert.ok(summary.suggestions.every((s) => s.amountCents === 21_900 || s.amountCents === 9_900));
});

test("no sugiere fusionar servicios que cobran el mismo mes (son distintos) ni de montos distintos", () => {
  const summary = subscriptionSummary([charge("Netflix", "2026-09", 22_900), charge("Disney", "2026-09", 22_900), charge("HBO", "2026-08", 18_900)], IDS, 3)!;
  assert.equal(summary.suggestions.length, 0);
});

test("la regla recordada captura cobros futuros con el mismo nombre aunque cambie el mayúsculas o los acentos", () => {
  const aliases = [{ aliasKey: subscriptionAliasKey("Xbox Game Pass"), groupId: 1, groupName: "Xbox" }];
  const summary = subscriptionSummary([charge("XBOX GAME PASS", "2026-09", 21_900)], IDS, 3, aliases)!;
  assert.equal(summary.services[0].name, "Xbox");
  assert.equal(summary.services[0].groupId, 1);
});

test("sin cargos en suscripciones o sin meses, no hay resumen", () => {
  assert.equal(subscriptionSummary([{ ...charge("Oxxo", "2026-09", 100), categoryId: 9 }], IDS, 3), null);
  assert.equal(subscriptionSummary([charge("Netflix", "2026-09", 100)], IDS, 0), null);
});

test("una fusión necesita nombre y al menos dos cargos distintos", () => {
  assert.throws(() => assertValidSubscriptionMerge(["Xbox"], "Xbox"), InvalidSubscriptionMergeError);
  assert.throws(() => assertValidSubscriptionMerge(["Xbox", "XBOX"], "Xbox"), InvalidSubscriptionMergeError);
  assert.throws(() => assertValidSubscriptionMerge(["a", "b"], "  "), InvalidSubscriptionMergeError);
  assert.doesNotThrow(() => assertValidSubscriptionMerge(["Xbox Game Pass", "Microsoft"], "Xbox"));
});
