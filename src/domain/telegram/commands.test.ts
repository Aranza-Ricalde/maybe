import assert from "node:assert/strict";
import { test } from "node:test";
import { parseBotCommand, recentCount } from "./commands";

test("reconoce comandos con argumento, con @bot y sin acentos", () => {
  assert.deepEqual(parseBotCommand("/saldo nu débito"), { name: "saldo", argument: "nu débito" });
  assert.deepEqual(parseBotCommand("/ultimos@MiBot 8"), { name: "ultimos", argument: "8" });
  assert.deepEqual(parseBotCommand("/últimos"), { name: "ultimos", argument: "" });
  assert.deepEqual(parseBotCommand("/nose"), { name: "desconocido", argument: "" });
});

test("un texto normal no es comando", () => {
  assert.equal(parseBotCommand("150 tacos"), null);
  assert.equal(parseBotCommand("hola /saldo"), null);
});

test("recentCount usa 5 por defecto, respeta enteros positivos y topa en 15", () => {
  assert.deepEqual(["", "abc", "0", "-3", "2.5", "3", "99"].map(recentCount), [5, 5, 5, 5, 5, 3, 15]);
});
