import { and, eq } from "drizzle-orm";
import { todayIso } from "@/lib/today";
import { AnswerTelegramQueryUseCase } from "@/application/answerTelegramQuery";
import { resolvePeriodContextUseCase } from "@/infrastructure/container";
import { DrizzleAccountsReader } from "@/infrastructure/db/readModels/accounts";
import { DrizzleTransactionsReader } from "@/infrastructure/db/readModels/transactions";
import { DrizzleDashboardRepository } from "@/infrastructure/db/dashboard";
import { CaptureMovementUseCase } from "@/application/captureMovement";
import { CaptureNotificationUseCase } from "@/application/captureNotification";
import { CorrectCaptureUseCase } from "@/application/correctCapture";
import { DeleteTransactionUseCase } from "@/application/deleteTransaction";
import { HandleTelegramMessageUseCase } from "@/application/handleTelegramMessage";
import { LinkTelegramUseCase } from "@/application/linkTelegram";
import { RecordTransactionUseCase } from "@/application/recordTransaction";
import { UpdateTransactionUseCase } from "@/application/updateTransaction";
import type { TelegramButton, TelegramSender } from "@/domain/telegram/ports";
import { DrizzleCaptureRepository } from "@/infrastructure/db/captures";
import { db } from "@/infrastructure/db/client";
import { DrizzleLedgerUnitOfWork } from "@/infrastructure/db/ledger";
import { accounts } from "@/infrastructure/db/schema/accounts";
import { categories } from "@/infrastructure/db/schema/classification";
import { families, users } from "@/infrastructure/db/schema/core";
import { telegramDrafts } from "@/infrastructure/db/schema/telegram";
import { transactions } from "@/infrastructure/db/schema/transactions";
import { DrizzleCategoriesReader } from "@/infrastructure/db/readModels/categories";
import { DrizzleTelegramRepository } from "@/infrastructure/db/telegram";
import { DrizzleTelegramDraftRepository } from "@/infrastructure/db/telegramDrafts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FALLÓ: ${message}`);
}

const CHAT_ID = "900000001";
const OTHER_CHAT_ID = "900000002";

class RecordingSender implements TelegramSender {
  sent: { kind: string; text: string; buttons?: TelegramButton[][] }[] = [];
  async sendMessage(_chatId: string, text: string, buttons?: TelegramButton[][]) {
    this.sent.push({ kind: "send", text, buttons });
  }
  async editMessage(_chatId: string, _messageId: number, text: string, buttons?: TelegramButton[][]) {
    this.sent.push({ kind: "edit", text, buttons });
  }
  async answerCallback(_callbackId: string, text?: string) {
    this.sent.push({ kind: "answer", text: text ?? "" });
  }
  get last() {
    return this.sent[this.sent.length - 1];
  }
}

async function main() {
  console.log("Creando datos de prueba (sin llamar a la API real de Telegram; usa una rama de prueba, nunca producción)...");
  const [family] = await db.insert(families).values({ name: "__smoke_test__", currency: "MXN" }).returning();
  const [user] = await db.insert(users).values({ familyId: family.id, email: "smoke-telegram@example.com", passwordHash: "n/a", name: "Rafa" }).returning();
  const [checking] = await db.insert(accounts).values({ familyId: family.id, name: "Checking", type: "checking" }).returning();
  const [cash] = await db.insert(accounts).values({ familyId: family.id, name: "Efectivo", type: "cash" }).returning();
  const [food] = await db.insert(categories).values({ familyId: family.id, name: "Comida", color: "#000", icon: "tag", classification: "expense" }).returning();

  const repo = new DrizzleTelegramRepository();
  const sender = new RecordingSender();
  const linkCodes = { codeFor: () => "SMOKECODE1", matches: (_userId: number, provided: string | null) => provided === "SMOKECODE1" };
  const link = new LinkTelegramUseCase(repo, sender, linkCodes);
  const uow = new DrizzleLedgerUnitOfWork(db);
  const updateTransaction = new UpdateTransactionUseCase(uow);
  const capturesRepo = new DrizzleCaptureRepository();
  const categoriesReader = new DrizzleCategoriesReader();
  const capture = new CaptureMovementUseCase(new RecordTransactionUseCase(uow), updateTransaction, capturesRepo, categoriesReader);
  const correct = new CorrectCaptureUseCase(capturesRepo, categoriesReader, uow, updateTransaction, new DeleteTransactionUseCase(uow));
  const queries = new AnswerTelegramQueryUseCase(new DrizzleAccountsReader(), new DrizzleTransactionsReader(), categoriesReader, resolvePeriodContextUseCase, new DrizzleDashboardRepository());
  const handler = new HandleTelegramMessageUseCase(repo, capture, new CaptureNotificationUseCase(capture), correct, queries, new DrizzleTelegramDraftRepository(), sender);

  try {
    console.log("1) Vinculando el chat directamente al usuario de prueba (el /link usa al primer usuario de la base, que no es este)...");
    await db.update(users).set({ telegramChatId: CHAT_ID }).where(eq(users.id, user.id));

    console.log("2) Un chat distinto es rechazado...");
    await link.execute(OTHER_CHAT_ID);
    assert(sender.last.text.includes("otra persona"), `esperaba el rechazo, llegó: "${sender.last.text}"`);

    console.log('3) "150 tacos" sin pista de cuenta — el bot pregunta la cuenta con botones y no registra nada todavía...');
    await handler.execute(CHAT_ID, "150 tacos");
    assert(sender.last.text.includes("¿En qué cuenta lo registro?"), `debió preguntar la cuenta: ${sender.last.text}`);
    assert((await db.select().from(transactions).where(eq(transactions.accountId, checking.id))).length === 0, "no debía registrarse antes de elegir la cuenta");
    const pickChecking = sender.last.buttons?.flat().find((b) => b.text.includes("Checking"));
    assert(pickChecking, "debió ofrecer la cuenta Checking");
    await handler.handleCallback(CHAT_ID, "cb0", 1, pickChecking.data);
    const [taco] = await db.select().from(transactions).where(and(eq(transactions.accountId, checking.id), eq(transactions.name, "tacos")));
    assert(taco?.amountCents === -15000 && taco.source === "telegram", "el gasto de tacos debió registrarse como telegram");
    assert(sender.last.kind === "answer", "el último paso debió ser contestar el botón");
    const card = sender.sent.filter((m) => m.kind === "edit").at(-1);
    assert(card && card.text.includes("¿De qué categoría es?"), "debió preguntar la categoría tras elegir la cuenta");
    const buttons = card.buttons?.flat() ?? [];
    assert(buttons.some((b) => b.text === "Comida") && buttons.some((b) => b.text.includes("Ver todas")) && buttons.some((b) => b.text.includes("Deshacer")), "debió ofrecer Comida, Ver todas y Deshacer");

    console.log("4) Botón de categoría — aplica Comida y confirma...");
    await handler.handleCallback(CHAT_ID, "cb1", 1, buttons.find((b) => b.text === "Comida")!.data);
    const [afterCategory] = await db.select().from(transactions).where(eq(transactions.id, taco.id));
    assert(afterCategory.categoryId === food.id, "la categoría debió quedar en Comida");
    assert(!(await capturesRepo.isPending(family.id, taco.id)), "ya no debía estar por confirmar");

    console.log('5) "+200 nomina #efectivo" — ingreso en la cuenta por el hint...');
    await handler.execute(CHAT_ID, "+200 nomina #efectivo");
    const [nomina] = await db.select().from(transactions).where(and(eq(transactions.accountId, cash.id), eq(transactions.name, "nomina")));
    assert(nomina?.amountCents === 20000, "el ingreso debió ir a Efectivo");

    console.log("6) Notificación bancaria pegada — se entiende con reglas...");
    await handler.execute(CHAT_ID, "Compra con TDD\nCompra con CUENTA en ANTHROPIC* CLAUDE $349.00 06 octubre 12:44h #checking");
    const [bank] = await db.select().from(transactions).where(and(eq(transactions.accountId, checking.id), eq(transactions.name, "ANTHROPIC* CLAUDE")));
    assert(bank?.amountCents === -34900, "la notificación debió registrar -349");

    console.log("7) Deshacer — borra el movimiento y revierte el saldo...");
    const undo = sender.sent.filter((m) => m.buttons).at(-1)?.buttons?.flat().find((b) => b.text.includes("Deshacer"));
    assert(undo, "debió haber botón Deshacer");
    await handler.handleCallback(CHAT_ID, "cb2", 2, undo.data);
    const rest = await db.select().from(transactions).where(eq(transactions.accountId, checking.id));
    assert(rest.every((t) => t.name !== "ANTHROPIC* CLAUDE"), "el movimiento deshecho no debía existir");

    console.log('8) "30 cafe ayer" — usa la fecha de ayer...');
    await handler.execute(CHAT_ID, "30 cafe ayer");
    const pickAgain = sender.last.buttons?.flat().find((b) => b.text.includes("Checking"));
    assert(pickAgain, "debió preguntar la cuenta");
    await handler.handleCallback(CHAT_ID, "cb9", 9, pickAgain.data);
    const [cafe] = await db.select().from(transactions).where(and(eq(transactions.accountId, checking.id), eq(transactions.name, "cafe")));
    assert(cafe && cafe.date < todayIso(), "el café debió quedar con fecha anterior a hoy");

    console.log("9) /saldo, /ultimos y /resumen — consultas reales a la base...");
    await handler.execute(CHAT_ID, "/saldo");
    assert(sender.last.text.includes("Checking") && sender.last.text.includes("Efectivo"), `/saldo debió listar las cuentas: ${sender.last.text}`);
    await handler.execute(CHAT_ID, "/ultimos 2");
    assert(sender.last.text.includes("Últimos movimientos"), "/ultimos debió responder movimientos");
    await handler.execute(CHAT_ID, "/resumen");
    assert(sender.last.text.includes("Resumen"), `/resumen debió responder: ${sender.last.text}`);

    console.log('10) "hola buenas" — responde la ayuda y no registra nada...');
    const before = (await db.select().from(transactions).where(eq(transactions.accountId, checking.id))).length;
    await handler.execute(CHAT_ID, "hola buenas");
    const after = (await db.select().from(transactions).where(eq(transactions.accountId, checking.id))).length;
    assert(before === after && sender.last.text.includes("No entendí"), "un mensaje inválido no debía crear nada");

    console.log("\nTODAS LAS VALIDACIONES PASARON ✓");
  } finally {
    console.log("\nLimpiando datos de prueba...");
    await db.delete(telegramDrafts).where(eq(telegramDrafts.familyId, family.id));
    await db.delete(transactions).where(eq(transactions.accountId, checking.id));
    await db.delete(transactions).where(eq(transactions.accountId, cash.id));
    await db.delete(categories).where(eq(categories.familyId, family.id));
    await db.delete(accounts).where(eq(accounts.familyId, family.id));
    await db.delete(users).where(eq(users.familyId, family.id));
    await db.delete(families).where(eq(families.id, family.id));
    console.log("Limpieza completa.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
