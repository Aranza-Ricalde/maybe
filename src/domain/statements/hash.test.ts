import assert from "node:assert/strict";
import { test } from "node:test";
import { descriptionSimilarity, importKeys, normalizeDescription } from "./hash";
import type { ParsedStatementTransaction } from "./types";

const tx = (date: string, description: string, amountCents: number): ParsedStatementTransaction => ({ date, description, amountCents, type: amountCents < 0 ? "expense" : "income" });

test("normalizar quita acentos, prefijos del banco, sufijos de RFC, folios largos y puntuación", () => {
  assert.equal(normalizeDescription("SPEI ENVIADO Mercado Pago – garrafones"), "mercado pago garrafones");
  assert.equal(normalizeDescription("Ubr* Pending.Uber.Com | RFC: S.I."), "ubr pending uber com");
  assert.equal(normalizeDescription("PAGO CUENTA DE TERCERO – pago yt y mas"), "pago yt y mas");
  assert.equal(normalizeDescription("Compra REST SUSHI ROLL MÉRIDA 0012345678"), "rest sushi roll merida");
});

test("la llave de importación incluye banco, últimos 4, fecha, monto y descripción normalizada", () => {
  const [key] = importKeys("bbva_debito", "1032", [tx("2026-08-05", "SPEI ENVIADO Mercado Pago", -10_000)]);
  assert.equal(key, "bbva_debito|1032|2026-08-05|-10000|mercado pago|1");
});

test("movimientos idénticos el mismo día reciben índices de ocurrencia distintos y la lista es estable", () => {
  const rows = [tx("2026-08-07", "VA Y VEN YUCATAN", -1_200), tx("2026-08-07", "VA Y VEN YUCATAN", -1_200), tx("2026-08-07", "VA Y VEN YUCATAN", -1_200), tx("2026-08-08", "VA Y VEN YUCATAN", -1_200)];
  const keys = importKeys("bbva_debito", "1032", rows);
  assert.equal(new Set(keys).size, 4);
  assert.deepEqual(keys.map((k) => k.split("|").at(-1)), ["1", "2", "3", "1"]);
  assert.deepEqual(importKeys("bbva_debito", "1032", rows), keys);
});

test("el mismo movimiento en otro banco, cuenta, fecha o monto produce otra llave", () => {
  const base = importKeys("bbva_debito", "1032", [tx("2026-08-07", "OXXO", -5_000)])[0];
  for (const other of [importKeys("nu_debito", "1032", [tx("2026-08-07", "OXXO", -5_000)])[0], importKeys("bbva_debito", "9999", [tx("2026-08-07", "OXXO", -5_000)])[0], importKeys("bbva_debito", "1032", [tx("2026-08-08", "OXXO", -5_000)])[0], importKeys("bbva_debito", "1032", [tx("2026-08-07", "OXXO", -5_001)])[0]]) assert.notEqual(other, base);
  assert.match(importKeys("nu_credito", null, [tx("2026-08-07", "OXXO", -5_000)])[0], /^nu_credito\|-\|/);
});

test("la similitud compara palabras, tolera prefijos largos y no depende del orden ni de prefijos del banco", () => {
  assert.equal(descriptionSimilarity("Mercadopago *Oncevein", "mercado pago oncevein"), 1);
  assert.ok(descriptionSimilarity("REST SUSHI ROLL MERIDA", "sushi") >= 1);
  assert.ok(descriptionSimilarity("tacos", "REST SUSHI ROLL MERIDA") === 0);
  assert.equal(descriptionSimilarity("", "algo"), 0);
  assert.equal(descriptionSimilarity("OXXO MONARCA MID", "oxxo"), 1);
});
