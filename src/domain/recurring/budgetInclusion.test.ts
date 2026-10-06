import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InvalidBudgetDecisionError,
  assertValidBudgetDecision,
  countsTowardBudget,
  inclusionForNewItem,
  inclusionOfDecision,
  normalizeBudgetPolicy,
  pendingBudgetDecisions,
  policyOfDecision,
  type BudgetDecisionCandidate,
} from "./budgetInclusion";

const item = (over: Partial<BudgetDecisionCandidate> & { id: number }): BudgetDecisionCandidate => ({
  name: `r${over.id}`,
  flow: "expense",
  status: "active",
  categoryId: 5,
  estimatedAmountCents: -10_000,
  budgetInclusion: null,
  ...over,
});

test("solo acepta decisiones conocidas", () => {
  assert.doesNotThrow(() => assertValidBudgetDecision("include"));
  assert.throws(() => assertValidBudgetDecision("maybe"), InvalidBudgetDecisionError);
});

test("una decisión se traduce a su valor y a su política", () => {
  assert.equal(inclusionOfDecision("include"), "included");
  assert.equal(inclusionOfDecision("exclude"), "excluded");
  assert.equal(policyOfDecision("include"), "always_include");
  assert.equal(policyOfDecision("exclude"), "never_include");
});

test("un valor de política desconocido o vacío significa preguntar", () => {
  assert.equal(normalizeBudgetPolicy(null), "ask");
  assert.equal(normalizeBudgetPolicy("lo-que-sea"), "ask");
  assert.equal(normalizeBudgetPolicy("always_include"), "always_include");
});

test("los recurrentes nuevos nacen según la política", () => {
  assert.equal(inclusionForNewItem("ask"), null);
  assert.equal(inclusionForNewItem("always_include"), "included");
  assert.equal(inclusionForNewItem("never_include"), "excluded");
});

test("sin decisión cuenta como siempre; solo 'excluded' lo saca del presupuesto", () => {
  assert.equal(countsTowardBudget({ budgetInclusion: null }), true);
  assert.equal(countsTowardBudget({}), true);
  assert.equal(countsTowardBudget({ budgetInclusion: "included" }), true);
  assert.equal(countsTowardBudget({ budgetInclusion: "excluded" }), false);
});

test("solo se pregunta por gastos activos con categoría que no tienen decisión, y solo si la política es preguntar", () => {
  const items = [
    item({ id: 1 }),
    item({ id: 2, budgetInclusion: "included" }),
    item({ id: 3, budgetInclusion: "excluded" }),
    item({ id: 4, flow: "income" }),
    item({ id: 5, status: "paused" }),
    item({ id: 6, categoryId: null }),
    item({ id: 7 }),
  ];
  assert.deepEqual(pendingBudgetDecisions(items, "ask").map((i) => i.id), [1, 7]);
  assert.deepEqual(pendingBudgetDecisions(items, "always_include"), []);
  assert.deepEqual(pendingBudgetDecisions(items, "never_include"), []);
});
