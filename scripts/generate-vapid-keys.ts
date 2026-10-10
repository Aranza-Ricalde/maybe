import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { generateServerKeys } from "@/infrastructure/push/webPushCrypto";

function main() {
  const file = process.argv[2];
  const subject = process.argv[3] ?? "mailto:admin@example.com";
  if (!file) throw new Error("Uso: tsx scripts/generate-vapid-keys.ts <archivo .env> [mailto:correo]");
  if (existsSync(file) && readFileSync(file, "utf8").includes("VAPID_PRIVATE_KEY=")) {
    console.log(`${file} ya tiene llaves VAPID; no se cambió nada.`);
    return;
  }
  const { privateKey, publicKey } = generateServerKeys();
  appendFileSync(file, `\nVAPID_PUBLIC_KEY="${publicKey.toString("base64url")}"\nVAPID_PRIVATE_KEY="${privateKey.toString("base64url")}"\nVAPID_SUBJECT="${subject}"\n`);
  console.log(`Llaves VAPID guardadas en ${file}. Llave pública: ${publicKey.toString("base64url")}`);
}

main();
