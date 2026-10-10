import assert from "node:assert/strict";
import { test } from "node:test";
import { statementPasswordFor } from "./passwords";

test("la contraseña del PDF sale de la variable del banco y solo si existe", () => {
  const env = { STATEMENT_PASSWORD_BBVA_DEBITO: "abc123", STATEMENT_PASSWORD_NU_DEBITO: "" } as unknown as NodeJS.ProcessEnv;
  assert.equal(statementPasswordFor("bbva_debito", env), "abc123");
  assert.equal(statementPasswordFor("nu_debito", env), undefined);
  assert.equal(statementPasswordFor("nu_credito", env), undefined);
});
