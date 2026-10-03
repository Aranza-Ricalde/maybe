import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InvalidCredentialsInputError,
  MIN_PASSWORD_LENGTH,
  REFRESH_TOKEN_TTL_MS,
  assertValidEmail,
  assertValidPassword,
  isExpired,
  refreshTokenExpiry,
} from "./rules";

test("assertValidEmail acepta un email normal y rechaza formatos inválidos", () => {
  assert.doesNotThrow(() => assertValidEmail("tu@correo.com"));
  assert.throws(() => assertValidEmail("sin-arroba.com"), InvalidCredentialsInputError);
  assert.throws(() => assertValidEmail("tu@sin-dominio"), InvalidCredentialsInputError);
  assert.throws(() => assertValidEmail("con espacio@correo.com"), InvalidCredentialsInputError);
  assert.throws(() => assertValidEmail(""), InvalidCredentialsInputError);
});

test(`assertValidPassword exige al menos ${MIN_PASSWORD_LENGTH} caracteres`, () => {
  assert.doesNotThrow(() => assertValidPassword("a".repeat(MIN_PASSWORD_LENGTH)));
  assert.throws(() => assertValidPassword("a".repeat(MIN_PASSWORD_LENGTH - 1)), InvalidCredentialsInputError);
});

test("refreshTokenExpiry suma REFRESH_TOKEN_TTL_MS a la fecha dada", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const expiry = refreshTokenExpiry(now);
  assert.equal(expiry.getTime(), now.getTime() + REFRESH_TOKEN_TTL_MS);
});

test("isExpired: pasado o exactamente ahora cuenta como vencido, futuro no", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const past = new Date(now.getTime() - 1000);
  const future = new Date(now.getTime() + 1000);
  assert.equal(isExpired(past, now), true);
  assert.equal(isExpired(now, now), true);
  assert.equal(isExpired(future, now), false);
});
