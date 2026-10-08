import assert from "node:assert/strict";
import { test } from "node:test";
import { FIELD } from "@/lib/formFields";
import { buildDecisionFormData } from "./occurrenceDecision";

test("la decisión viaja con el id de la ocurrencia y la acción elegida", () => {
  const formData = buildDecisionFormData(12, "mark_paid");
  assert.equal(formData.get(FIELD.occurrenceId), "12");
  assert.equal(formData.get(FIELD.decision), "mark_paid");
});
