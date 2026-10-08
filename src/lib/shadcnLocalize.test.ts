import assert from "node:assert/strict";
import { test } from "node:test";
import { localizeShadcnClasses } from "./shadcnLocalize";

test("corrige la importación de la utilidad cn que genera el CLI y no toca la correcta", () => {
  assert.equal(localizeShadcnClasses('import { cn } from "cn"'), 'import { cn } from "@/lib/utils"');
  assert.equal(localizeShadcnClasses('import { cn } from "@/lib/utils"'), 'import { cn } from "@/lib/utils"');
});
