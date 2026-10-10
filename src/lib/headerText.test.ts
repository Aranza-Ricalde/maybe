import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeHeaderText } from "./headerText";

test("un encabezado con acentos mal decodificado por el transporte se recupera", () => {
  assert.equal(decodeHeaderText(Buffer.from("Nu Débito", "utf8").toString("latin1")), "Nu Débito");
});

test("un encabezado con porcentaje se decodifica y uno ASCII queda igual", () => {
  assert.equal(decodeHeaderText("Nu%20D%C3%A9bito"), "Nu Débito");
  assert.equal(decodeHeaderText("  BBVA "), "BBVA");
});

test("un texto latino válido que no es UTF-8 mal leído no se rompe", () => {
  assert.equal(decodeHeaderText("Débito"), "Débito");
});
