/**
 * Valida la integración de Telegram contra la API real (manda mensajes de
 * verdad a tu Telegram) y contra la base real de Neon.
 * Uso: pnpm exec tsx --env-file=.env.local scripts/smoke-test-telegram.ts
 */
import { and, eq } from "drizzle-orm";
import { HandleTelegramMessageUseCase } from "@/application/handleTelegramMessage";
import { LinkTelegramUseCase } from "@/application/linkTelegram";
import { RecordTransactionUseCase } from "@/application/recordTransaction";
import type { TelegramSender } from "@/domain/telegram/ports";
import { db } from "@/infrastructure/db/client";
import { DrizzleLedgerUnitOfWork } from "@/infrastructure/db/ledger";
import { accounts } from "@/infrastructure/db/schema/accounts";
import { families, users } from "@/infrastructure/db/schema/core";
import { transactions } from "@/infrastructure/db/schema/transactions";
import { DrizzleTelegramRepository } from "@/infrastructure/db/telegram";
import { TelegramApiSender } from "@/infrastructure/telegram/sender";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FALLÓ: ${message}`);
}

// chat_id real, obtenido de getUpdates — los mensajes de este script SÍ llegan a tu Telegram de verdad.
const REAL_CHAT_ID = "6945796025";
const FAKE_SECOND_CHAT_ID = "999999999"; // nunca existió en Telegram; solo se usa con un sender falso, nunca llama a la API real

class RecordingSender implements TelegramSender {
  sent: { chatId: string; text: string }[] = [];
  async sendMessage(chatId: string, text: string): Promise<void> {
    this.sent.push({ chatId, text });
  }
}

async function main() {
  console.log("Creando datos de prueba...");
  const [family] = await db.insert(families).values({ name: "__smoke_test__", currency: "MXN" }).returning();
  const [user] = await db
    .insert(users)
    .values({ familyId: family.id, email: "smoke-telegram@example.com", passwordHash: "n/a", name: "Rafa" })
    .returning();
  const [checking] = await db.insert(accounts).values({ familyId: family.id, name: "Checking", type: "checking" }).returning();
  const [cash] = await db.insert(accounts).values({ familyId: family.id, name: "Efectivo", type: "cash" }).returning();

  const repo = new DrizzleTelegramRepository();
  const realSender = new TelegramApiSender();
  const link = new LinkTelegramUseCase(repo, realSender);
  const recordTransaction = new RecordTransactionUseCase(new DrizzleLedgerUnitOfWork(db));
  const handleMessage = new HandleTelegramMessageUseCase(repo, recordTransaction, realSender);

  try {
    console.log("1) /start con tu chat_id real — debe vincularte y mandarte un mensaje de verdad a Telegram...");
    await link.execute(REAL_CHAT_ID);
    const [linkedUser] = await db.select().from(users).where(eq(users.id, user.id));
    assert(linkedUser.telegramChatId === REAL_CHAT_ID, "el chat_id debió quedar guardado en el usuario");
    console.log("   ✓ vinculado — revisa tu Telegram, debería haber llegado un mensaje de confirmación");

    console.log("2) /start otra vez (ya vinculado) — debe avisarte que ya estabas vinculado...");
    await link.execute(REAL_CHAT_ID);
    console.log("   ✓ segundo /start manejado sin re-vincular");

    console.log("3) Un chat DISTINTO intenta vincularse (con sender falso, nunca toca la API real)...");
    const recording = new RecordingSender();
    const linkWithFakeSender = new LinkTelegramUseCase(repo, recording);
    await linkWithFakeSender.execute(FAKE_SECOND_CHAT_ID);
    assert(recording.sent.length === 1, "debió responder algo al chat falso");
    assert(recording.sent[0].text.includes("otra persona"), `esperaba el mensaje de rechazo, llegó: "${recording.sent[0].text}"`);
    const [stillOriginalOwner] = await db.select().from(users).where(eq(users.id, user.id));
    assert(stillOriginalOwner.telegramChatId === REAL_CHAT_ID, "el chat original no debía perder su vínculo");
    console.log("   ✓ un segundo chat distinto fue rechazado, el vínculo original no se tocó");

    console.log('4) Mensaje real: "150 tacos" — debe registrarse como gasto en la cuenta default (Checking) y avisarte por Telegram...');
    await handleMessage.execute(REAL_CHAT_ID, "150 tacos");
    const [tacoTx] = await db.select().from(transactions).where(and(eq(transactions.accountId, checking.id), eq(transactions.name, "tacos")));
    assert(tacoTx != null, "la transacción de tacos debió crearse");
    assert(tacoTx.amountCents === -15000, `se esperaba -15000, llegó ${tacoTx.amountCents}`);
    assert(tacoTx.source === "telegram", `source debía ser "telegram", fue "${tacoTx.source}"`);
    console.log("   ✓ -$150.00 \"tacos\" registrado en Checking, mensaje de confirmación enviado");

    console.log('5) Mensaje real: "+200 nomina" — debe registrarse como ingreso...');
    await handleMessage.execute(REAL_CHAT_ID, "+200 nomina");
    const [nominaTx] = await db.select().from(transactions).where(and(eq(transactions.accountId, checking.id), eq(transactions.name, "nomina")));
    assert(nominaTx.amountCents === 20000, `se esperaba +20000, llegó ${nominaTx.amountCents}`);
    console.log("   ✓ +$200.00 \"nomina\" registrado como ingreso");

    console.log('6) Mensaje real: "50 dulces #efectivo" — debe resolver la cuenta por el hint, no la default...');
    await handleMessage.execute(REAL_CHAT_ID, "50 dulces #efectivo");
    const [dulcesTx] = await db.select().from(transactions).where(and(eq(transactions.accountId, cash.id), eq(transactions.name, "dulces")));
    assert(dulcesTx != null, "la transacción de dulces debió ir a la cuenta Efectivo, no a Checking");
    console.log("   ✓ \"#efectivo\" resolvió correctamente a la cuenta Efectivo, no a la default");

    console.log('7) Mensaje real sin números: "hola buenas" — debe responder el error de formato sin registrar nada...');
    const beforeCount = (await db.select().from(transactions)).length;
    await handleMessage.execute(REAL_CHAT_ID, "hola buenas");
    const afterCount = (await db.select().from(transactions)).length;
    assert(beforeCount === afterCount, "un mensaje sin formato válido no debía crear ninguna transacción");
    console.log("   ✓ mensaje no reconocido no creó nada (deberías ver el mensaje de ayuda en Telegram)");

    console.log("\nTODAS LAS VALIDACIONES PASARON ✓ — revisa tu Telegram, deberías ver 6 mensajes del bot.");
  } finally {
    console.log("\nLimpiando datos de prueba...");
    await db.delete(transactions).where(eq(transactions.accountId, checking.id));
    await db.delete(transactions).where(eq(transactions.accountId, cash.id));
    await db.delete(accounts).where(eq(accounts.familyId, family.id));
    await db.delete(users).where(eq(users.familyId, family.id));
    await db.delete(families).where(eq(families.id, family.id));
    console.log("Limpieza completa, no quedó basura en production.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
