import assert from "node:assert/strict";
import { test } from "node:test";
import { isNavActive } from "./navigation";

test("el Resumen solo está activo en la raíz y no en el resto de rutas", () => {
  assert.equal(isNavActive("/", "/"), true);
  assert.equal(isNavActive("/budgets", "/"), false);
});

test("una ruta está activa en su página y en las subrutas, pero no en rutas que solo comparten prefijo", () => {
  assert.equal(isNavActive("/budgets", "/budgets"), true);
  assert.equal(isNavActive("/budgets/nuevo", "/budgets"), true);
  assert.equal(isNavActive("/budgetsx", "/budgets"), false);
  assert.equal(isNavActive("/import", "/budgets"), false);
});

test("separa la barra inferior del menú Más y marca cuál está activo", async () => {
  const { partitionNav } = await import("./navigation");
  const items = [
    { href: "/", inBottomBar: true },
    { href: "/transactions", inBottomBar: true },
    { href: "/goals", inBottomBar: false },
  ];
  const onGoals = partitionNav(items, "/goals");
  assert.equal(onGoals.bar.length, 2);
  assert.equal(onGoals.more.length, 1);
  assert.equal(onGoals.moreActive, true);
  assert.equal(partitionNav(items, "/transactions").moreActive, false);
  assert.equal(partitionNav(items, "/transactions").bar[1].active, true);
});
