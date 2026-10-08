import assert from "node:assert/strict";
import { test } from "node:test";
import type { Insight } from "@/domain/insights/rules";
import { buildDecisions, splitInsights } from "./attention";

const insight = (id: string, weight: number): Insight => ({ id, tone: "change", message: id, weight });

test("las decisiones juntan recurrentes y coincidencias con una clave única por tipo", () => {
  const decisions = buildDecisions(
    [{ id: 1, suggestedName: "Netflix", suggestedAmountCents: 22900 }],
    [{ id: 1, score: 0.9, transactionId: 5, transactionName: "NETFLIX.COM", transactionDate: "2026-10-01", transactionAmountCents: 22900, conceptName: "Netflix" } as never],
  );
  assert.deepEqual(decisions.map((d) => [d.key, d.kind]), [["r1", "recurring"], ["c1", "concept"]]);
  assert.match(decisions[0].title, /Netflix/);
});

test("los avisos se ordenan por peso: se muestran los más importantes y el resto queda aparte", () => {
  const { top, rest } = splitInsights([insight("a", 1), insight("b", 9), insight("c", 5), insight("d", 3)], 3);
  assert.deepEqual(top.map((i) => i.id), ["b", "c", "d"]);
  assert.deepEqual(rest.map((i) => i.id), ["a"]);
});
