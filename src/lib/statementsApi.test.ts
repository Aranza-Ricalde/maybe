import assert from "node:assert/strict";
import { test } from "node:test";
import { confirmResultFrom } from "./statementsApi";

const fallback = { toImport: 5, toLink: 2, toSkip: 1, toPair: 0 };

test("usa lo que responde el servidor cuando viene completo", () => {
  assert.deepEqual(confirmResultFrom({ importados: 3, vinculados: 4, omitidos: 0, emparejados: 1 }, fallback), { importId: null, imported: 3, linked: 4, skipped: 0, paired: 1 });
});

test("completa con el resumen local lo que el servidor no informa", () => {
  assert.deepEqual(confirmResultFrom({}, fallback), { importId: null, imported: 5, linked: 2, skipped: 1, paired: 0 });
});
