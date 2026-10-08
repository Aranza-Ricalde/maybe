import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { localizeShadcnClasses } from "../src/lib/shadcnLocalize";

const UI_DIR = join(__dirname, "..", "src", "components", "ui");
let changed = 0;
for (const file of readdirSync(UI_DIR).filter((name) => name.endsWith(".tsx"))) {
  const path = join(UI_DIR, file);
  const source = readFileSync(path, "utf8");
  const result = localizeShadcnClasses(source);
  if (result !== source) {
    writeFileSync(path, result);
    changed++;
  }
}
console.log(`${changed} archivos de ui ajustados`);
