import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSwitchFormData } from "./switchForm";

const spec = { fields: { id: 4 }, stateField: { name: "status", onValue: "active", offValue: "paused" } };

test("el interruptor envía los campos fijos y el valor según el estado nuevo", () => {
  const on = buildSwitchFormData(spec, true);
  assert.equal(on.get("id"), "4");
  assert.equal(on.get("status"), "active");
  assert.equal(buildSwitchFormData(spec, false).get("status"), "paused");
});
