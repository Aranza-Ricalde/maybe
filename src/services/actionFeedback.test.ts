import assert from "node:assert/strict";
import { test } from "node:test";
import { actionFailed, actionOk } from "@/lib/actionResult";
import { reportResult, withFeedback, type Notifier } from "./actionFeedback";

function recorder() {
  const events: string[] = [];
  const notifier: Notifier = { success: (m) => void events.push(`ok:${m}`), error: (m) => void events.push(`error:${m}`) };
  return { events, notifier };
}

test("un resultado exitoso avisa con su mensaje y devuelve verdadero", () => {
  const { events, notifier } = recorder();
  assert.equal(reportResult(actionOk("Meta creada"), notifier), true);
  assert.deepEqual(events, ["ok:Meta creada"]);
});

test("un resultado fallido avisa del error y devuelve falso", () => {
  const { events, notifier } = recorder();
  assert.equal(reportResult(actionFailed("No se pudo"), notifier), false);
  assert.deepEqual(events, ["error:No se pudo"]);
});

test("una acción sin resultado no genera aviso y se considera exitosa", () => {
  const { events, notifier } = recorder();
  assert.equal(reportResult(undefined, notifier), true);
  assert.deepEqual(events, []);
});

test("si la acción lanza una excepción avisa con el mensaje genérico", async () => {
  const { events, notifier } = recorder();
  const run = withFeedback(async () => {
    throw new Error("boom");
  }, notifier);
  assert.equal(await run(new FormData()), false);
  assert.equal(events.length, 1);
  assert.match(events[0], /^error:/);
});

test("withFeedback ejecuta la acción con el mismo formulario y reporta su resultado", async () => {
  const { events, notifier } = recorder();
  const seen: FormDataEntryValue[] = [];
  const run = withFeedback(async (formData) => {
    seen.push(formData.get("x") as string);
    return actionOk("Guardado");
  }, notifier);
  const form = new FormData();
  form.set("x", "1");
  assert.equal(await run(form), true);
  assert.deepEqual(seen, ["1"]);
  assert.deepEqual(events, ["ok:Guardado"]);
});
