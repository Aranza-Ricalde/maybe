import assert from "node:assert/strict";
import { test } from "node:test";
import { InvalidInboxStatementError, MAX_INBOX_STATEMENT_BYTES, assertInboxFile, isStatementBank, looksLikePdf } from "./inbox";

const pdf = (extra = 0) => Uint8Array.from([...Buffer.from("%PDF-1.4"), ...new Array(extra).fill(0)]);

test("un PDF se reconoce por su contenido y no por su tipo declarado", () => {
  assert.equal(looksLikePdf(pdf()), true);
  assert.equal(looksLikePdf(Buffer.from("<html>")), false);
  assert.equal(looksLikePdf(new Uint8Array()), false);
});

test("se rechaza lo vacío, lo que no es PDF y lo mayor a 4 MB", () => {
  assert.doesNotThrow(() => assertInboxFile(pdf(10)));
  assert.throws(() => assertInboxFile(new Uint8Array()), InvalidInboxStatementError);
  assert.throws(() => assertInboxFile(Buffer.from("hola mundo")), InvalidInboxStatementError);
  assert.throws(() => assertInboxFile(pdf(MAX_INBOX_STATEMENT_BYTES)), InvalidInboxStatementError);
});

test("solo se aceptan los bancos conocidos", () => {
  assert.equal(isStatementBank("bbva_debito"), true);
  assert.equal(isStatementBank("otro_banco"), false);
});
