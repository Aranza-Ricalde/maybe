import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_THEME_PREFERENCE, initialThemeAttribute, normalizeThemePreference, readCookieValue, resolveTheme, themeCookie } from "./theme";

test("las preferencias inválidas o vacías caen al valor por defecto (sistema)", () => {
  assert.equal(DEFAULT_THEME_PREFERENCE, "system");
  assert.equal(normalizeThemePreference(null), "system");
  assert.equal(normalizeThemePreference("morado"), "system");
  assert.equal(normalizeThemePreference("dark"), "dark");
  assert.equal(normalizeThemePreference("light"), "light");
});

test("sistema sigue al sistema operativo y claro u oscuro lo ignoran", () => {
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("system", false), "light");
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
});

test("el servidor pinta el tema elegido, o el último que resolvió el sistema, o claro si no hay nada", () => {
  assert.equal(initialThemeAttribute("dark", "light"), "dark");
  assert.equal(initialThemeAttribute("light", "dark"), "light");
  assert.equal(initialThemeAttribute("system", "dark"), "dark");
  assert.equal(initialThemeAttribute("system", undefined), "light");
  assert.equal(initialThemeAttribute(undefined, "dark"), "dark");
  assert.equal(initialThemeAttribute("basura", "basura"), "light");
});

test("la cookie dura un año, es válida para toda la app y se puede leer de vuelta", () => {
  const cookie = themeCookie("maybe-theme", "dark");
  assert.match(cookie, /^maybe-theme=dark; Path=\/; Max-Age=31536000; SameSite=Lax$/);
  assert.equal(readCookieValue("a=1; maybe-theme=dark; b=2", "maybe-theme"), "dark");
  assert.equal(readCookieValue("a=1", "maybe-theme"), null);
  assert.equal(readCookieValue("", "maybe-theme"), null);
});
