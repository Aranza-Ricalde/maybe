import assert from "node:assert/strict";
import { test } from "node:test";
import { formatPesos } from "./format";

test("formatPesos: un monto negativo que redondea a cero se muestra $0, nunca -$0", () => {
  assert.equal(formatPesos(-2), "$0");
  assert.equal(formatPesos(-49), "$0");
});

test("formatPesos: redondea a pesos conservando el signo", () => {
  assert.equal(formatPesos(-213_100), "-$2,131");
});

import { formatPercent, formatSignedPercent } from "./format";

test("formatPercent y formatSignedPercent: redondean, y el signo solo aparece si hay variación", () => {
  assert.equal(formatPercent(0.374), "37%");
  assert.equal(formatSignedPercent(0.12), "+12%");
  assert.equal(formatSignedPercent(-0.05), "−5%");
  assert.equal(formatSignedPercent(0), "0%");
});
