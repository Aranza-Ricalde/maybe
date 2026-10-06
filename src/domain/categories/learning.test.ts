import assert from "node:assert/strict";
import { test } from "node:test";
import { learnCategoryFromUsage } from "./learning";

test("aprende la categoría cuando el historial es suficiente y consistente", () => {
  assert.deepEqual(learnCategoryFromUsage([{ categoryId: 7, count: 5 }]), { categoryId: 7, share: 1, sample: 5 });
  assert.equal(learnCategoryFromUsage([{ categoryId: 7, count: 9 }, { categoryId: 8, count: 1 }])?.categoryId, 7);
});

test("con poca evidencia no asigna nada", () => {
  assert.equal(learnCategoryFromUsage([{ categoryId: 7, count: 4 }]), null);
  assert.equal(learnCategoryFromUsage([]), null);
});

test("con evidencia dividida no asigna nada: el usuario decide", () => {
  assert.equal(learnCategoryFromUsage([{ categoryId: 7, count: 6 }, { categoryId: 8, count: 4 }]), null);
  assert.equal(learnCategoryFromUsage([{ categoryId: 7, count: 8 }, { categoryId: 8, count: 2 }]), null);
});

test("el umbral de consistencia es inclusivo (9 de 10 sí, 8 de 10 no)", () => {
  assert.equal(learnCategoryFromUsage([{ categoryId: 7, count: 9 }, { categoryId: 8, count: 1 }])?.share, 0.9);
});
