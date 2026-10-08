import assert from "node:assert/strict";
import { test } from "node:test";
import { initialsOf, pageTitleFor } from "./breadcrumb";

const routes = [{ href: "/", label: "Resumen" }, { href: "/accounts", label: "Cuentas" }, { href: "/settings", label: "Configuración" }];

test("el título sale de la ruta más específica y la raíz solo coincide exacta", () => {
  assert.equal(pageTitleFor("/", routes), "Resumen");
  assert.equal(pageTitleFor("/accounts", routes), "Cuentas");
  assert.equal(pageTitleFor("/accounts/5", routes), "Cuentas");
  assert.equal(pageTitleFor("/otra", routes), "");
});

test("las iniciales usan nombre y apellido, o las dos primeras letras de un solo nombre", () => {
  assert.equal(initialsOf("Rafael Perea"), "RP");
  assert.equal(initialsOf("Rafael"), "RA");
  assert.equal(initialsOf("  "), "?");
});
