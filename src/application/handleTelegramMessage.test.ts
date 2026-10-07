import assert from "node:assert/strict";
import { test } from "node:test";
import type { CategoryClassifier } from "@/domain/captures/ports";
import { decodeCallback } from "@/domain/telegram/callbacks";
import type { MovementDraft, TelegramButton, TelegramDraftRepository, TelegramRepository, TelegramSender } from "@/domain/telegram/ports";
import type { AccountsReader, TransactionsReader } from "@/domain/readModels/ports";
import type { FlowReader } from "@/domain/dashboard/ports";
import type { ResolvePeriodContextUseCase } from "./pages/resolvePeriodContext";
import { AnswerTelegramQueryUseCase } from "./answerTelegramQuery";
import { CaptureMovementUseCase } from "./captureMovement";
import { CaptureNotificationUseCase } from "./captureNotification";
import { CorrectCaptureUseCase } from "./correctCapture";
import { DeleteTransactionUseCase } from "./deleteTransaction";
import { FakeCaptures, fakeCategoriesReader } from "./fakeCaptures.testkit";
import { FakeLedger } from "./fakeLedger.testkit";
import { HandleTelegramMessageUseCase } from "./handleTelegramMessage";
import { RecordTransactionUseCase } from "./recordTransaction";
import { UpdateTransactionUseCase } from "./updateTransaction";

interface Sent { kind: "send" | "edit" | "answer"; text: string; buttons?: TelegramButton[][] }

class RecordingSender implements TelegramSender {
  readonly log: Sent[] = [];
  async sendMessage(_chatId: string, text: string, buttons?: TelegramButton[][]) { this.log.push({ kind: "send", text, buttons }); }
  async editMessage(_chatId: string, _messageId: number, text: string, buttons?: TelegramButton[][]) { this.log.push({ kind: "edit", text, buttons }); }
  async answerCallback(_callbackId: string, text?: string) { this.log.push({ kind: "answer", text: text ?? "" }); }
  get last() { return this.log[this.log.length - 1]; }
  buttonData(index = 0) { return this.log.filter((entry) => entry.buttons).at(-1)?.buttons?.flat()[index]?.data ?? ""; }
}

class FakeDrafts implements TelegramDraftRepository {
  readonly items = new Map<number, MovementDraft>();
  private nextId = 1;
  async create(draft: MovementDraft) { this.items.set(this.nextId, draft); return this.nextId++; }
  async take(chatId: string, id: number) {
    const draft = this.items.get(id);
    if (!draft || draft.chatId !== chatId) return null;
    this.items.delete(id);
    return draft;
  }
}

function setup(options: { classifier?: CategoryClassifier; linked?: boolean; accountNames?: string[]; lastUsedAccountId?: number | null } = {}) {
  const names = options.accountNames ?? ["BBVA", "Nu"];
  const accountList = names.map((name, index) => ({ id: index + 1, name }));
  const ledger = new FakeLedger();
  accountList.forEach((account) => ledger.addAccount(account.id));
  const captures = new FakeCaptures(ledger, accountList);
  const record = new RecordTransactionUseCase(ledger);
  const update = new UpdateTransactionUseCase(ledger);
  const capture = new CaptureMovementUseCase(record, update, captures, fakeCategoriesReader, undefined, options.classifier);
  const correct = new CorrectCaptureUseCase(captures, fakeCategoriesReader, ledger, update, new DeleteTransactionUseCase(ledger));
  const repo: TelegramRepository = {
    findUserByChatId: async () => (options.linked === false ? null : { id: 1, familyId: 1, name: "Ana" }),
    findAnyLinkedUser: async () => null,
    findFirstUser: async () => null,
    linkChatId: async () => undefined,
    listAccounts: async () => accountList,
    lastUsedAccountId: async () => options.lastUsedAccountId ?? null,
    resolveAccount: async (_familyId, hint) => (hint ? (accountList.find((a) => a.name.toLowerCase().includes(hint.toLowerCase())) ?? null) : null),
  };
  const sender = new RecordingSender();
  const drafts = new FakeDrafts();
  const accounts = {
    listActive: async () => [
      { id: 1, name: "BBVA", type: "checking", details: null },
      { id: 2, name: "Nu", type: "savings", details: null },
      { id: 3, name: "Tarjeta Nu", type: "credit_card", details: null },
    ],
    balancesAsOf: async () => new Map([[1, 150_000], [2, 50_000], [3, -20_000]]),
  } as unknown as AccountsReader;
  const transactions = { recent: async (_familyId: number, limit: number) => Array.from({ length: Math.min(limit, 20) }, (_, i) => ({ id: i, date: "2026-10-0" + ((i % 9) + 1), amountCents: -1000 * (i + 1), name: `Mov ${i + 1}`, kind: "standard", categoryName: i === 0 ? "Comida" : null, accountName: "BBVA" })) } as unknown as TransactionsReader;
  const periods = { execute: async () => ({ displayPeriod: { start: "2026-10-01", end: "2026-10-15" } }) } as unknown as ResolvePeriodContextUseCase;
  const flow = { getFlowForDateRange: async () => ({ incomeCents: 500_000, expenseCents: 120_000 }) } as unknown as FlowReader;
  const queries = new AnswerTelegramQueryUseCase(accounts, transactions, { list: async () => [{ id: 10, name: "Comida" }, { id: 11, name: "Transporte" }], expenseTotalsBetween: async () => [{ categoryId: 11, totalCents: 30_000 }, { categoryId: 10, totalCents: 80_000 }] } as never, periods, flow);
  return { ledger, captures, sender, drafts, handler: new HandleTelegramMessageUseCase(repo, capture, new CaptureNotificationUseCase(capture), correct, queries, drafts, sender) };
}

test("un gasto sin categoría se registra y el bot pregunta con botones de categorías y deshacer", async () => {
  const { ledger, sender, handler } = setup();
  await handler.execute("chat", "150 tacos #bbva");

  assert.match(sender.last.text, /−\$150\.00 · tacos/);
  assert.match(sender.last.text, /Sin categoría/);
  assert.match(sender.last.text, /¿De qué categoría es\?/);
  assert.equal(ledger.balanceOf(1), -15_000);
  const actions = sender.last.buttons?.flat().map((button) => decodeCallback(button.data)?.action);
  assert.deepEqual(actions, ["cat", "cat", "cat", "cat", "nav", "undo"]);
});

test("elegir una categoría con el botón la aplica, confirma y deja cambiar o deshacer", async () => {
  const { ledger, captures, sender, handler } = setup();
  await handler.execute("chat", "150 tacos #bbva");
  await handler.handleCallback("chat", "cb", 7, sender.buttonData(0));

  assert.match(sender.log.filter((entry) => entry.kind === "edit").at(-1)!.text, /📂 Comida/);
  assert.equal(captures.pending.size, 0);
  assert.deepEqual(sender.log.at(-1)?.kind, "answer");
  assert.equal([...ledger.transactions.values()][0].categoryId, 10);
  const edit = sender.log.filter((entry) => entry.kind === "edit").at(-1)!;
  assert.deepEqual(edit.buttons?.flat().map((button) => decodeCallback(button.data)?.action), ["change", "undo"]);
});

test("deshacer borra el movimiento y revierte el saldo", async () => {
  const { ledger, sender, handler } = setup();
  await handler.execute("chat", "150 tacos #bbva");
  const undo = sender.log.at(-1)!.buttons!.flat().find((button) => decodeCallback(button.data)?.action === "undo")!;
  await handler.handleCallback("chat", "cb", 7, undo.data);

  assert.equal(ledger.transactions.size, 0);
  assert.equal(ledger.balanceOf(1), 0);
  assert.match(sender.log.filter((entry) => entry.kind === "edit").at(-1)!.text, /Deshecho/);
});

test("con categoría de Gemini de confianza media pregunta '¿Es correcta?' y 'Sí' confirma", async () => {
  const { captures, sender, handler } = setup({ classifier: { classify: async () => ({ categoryId: 11, confidence: "medium" }) } });
  await handler.execute("chat", "80 uber #bbva");

  assert.match(sender.last.text, /Transporte/);
  assert.match(sender.last.text, /¿Es correcta la categoría\?/);
  const yes = sender.last.buttons!.flat().find((button) => decodeCallback(button.data)?.action === "ok")!;
  await handler.handleCallback("chat", "cb", 7, yes.data);
  assert.equal(captures.pending.size, 0);
  assert.match(sender.log.filter((entry) => entry.kind === "edit").at(-1)!.text, /Confirmado/);
});

test("'Cambiar' muestra las categorías del mismo tipo y no se acepta una de otro tipo", async () => {
  const { sender, handler } = setup({ classifier: { classify: async () => ({ categoryId: 10, confidence: "high" }) } });
  await handler.execute("chat", "60 comida #bbva");
  const change = sender.last.buttons!.flat().find((button) => decodeCallback(button.data)?.action === "change")!;
  await handler.handleCallback("chat", "cb", 7, change.data);
  const shown = sender.log.filter((entry) => entry.kind === "edit").at(-1)!.buttons!.flat().map((button) => decodeCallback(button.data)?.arg).filter(Boolean);
  assert.deepEqual(shown, [10, 11, 12, 13]);

  const transactionId = decodeCallback(change.data)!.id;
  await handler.handleCallback("chat", "cb2", 7, `cat:${transactionId}:20`);
  assert.match(sender.last.text, /no aplica/);
});

test("un ingreso con + y la cuenta por #hint se registra en esa cuenta", async () => {
  const { ledger, handler } = setup();
  await handler.execute("chat", "+2000 nómina #nu");

  assert.equal(ledger.balanceOf(2), 200_000);
  assert.equal([...ledger.transactions.values()][0].source, "telegram");
});

test("pegar la notificación del banco también registra, con la cuenta por defecto", async () => {
  const { ledger, sender, handler } = setup();
  await handler.execute("chat", "Compra con TDD\nCompra con CUENTA en ANTHROPIC* CLAUDE $349.00 06 octubre 12:44h #bbva");

  assert.equal(ledger.balanceOf(1), -34_900);
  assert.equal([...ledger.transactions.values()][0].source, "telegram");
  assert.match(sender.last.text, /ANTHROPIC\* CLAUDE/);
});

test("un texto que no es movimiento responde la ayuda; un chat desconocido o un botón inválido no tocan nada", async () => {
  const { ledger, sender, handler } = setup();
  await handler.execute("chat", "hola buenas");
  assert.match(sender.last.text, /No entendí/);
  await handler.handleCallback("chat", "cb", 7, "cat:1:abc");
  assert.match(sender.last.text, /no válida/);
  assert.equal(ledger.transactions.size, 0);

  const stranger = setup({ linked: false });
  await stranger.handler.execute("x", "150 tacos");
  await stranger.handler.handleCallback("x", "cb", 7, "undo:1");
  assert.equal(stranger.ledger.transactions.size, 0);
  assert.match(stranger.sender.log[0].text, /No reconozco/);
});

test("no se puede tocar un movimiento ajeno o no capturado desde un botón", async () => {
  const { ledger, sender, handler } = setup();
  await new RecordTransactionUseCase(ledger).execute({ accountId: 1, date: "2026-10-01", amountCents: -500, name: "manual", source: "manual" });
  await handler.handleCallback("chat", "cb", 7, "undo:1");

  assert.equal(ledger.transactions.size, 1);
  assert.match(sender.last.text, /ya no existe/);
});

test("/saldo lista las cuentas, separa las deudas y /saldo nu filtra por nombre", async () => {
  const { sender, handler } = setup();
  await handler.execute("chat", "/saldo");
  assert.match(sender.last.text, /BBVA: \$1,500\.00/);
  assert.match(sender.last.text, /Total: \$2,000\.00/);
  assert.match(sender.last.text, /Deudas y tarjetas\n• Tarjeta Nu: −\$200\.00/);

  await handler.execute("chat", "/saldo@MiBot nu");
  assert.doesNotMatch(sender.last.text, /BBVA/);
  await handler.execute("chat", "/saldo zzz");
  assert.match(sender.last.text, /No encontré una cuenta/);
});

test("/ultimos usa 5 por defecto, respeta el número y lo limita a 15", async () => {
  const { sender, handler } = setup();
  const count = () => (sender.last.text.match(/Mov \d+/g) ?? []).length;
  await handler.execute("chat", "/ultimos");
  assert.equal(count(), 5);
  await handler.execute("chat", "/ultimos 3");
  assert.equal(count(), 3);
  await handler.execute("chat", "/ultimos 500");
  assert.equal(count(), 15);
});

test("/resumen muestra ingresos, gastos, balance y las categorías con más gasto", async () => {
  const { sender, handler } = setup();
  await handler.execute("chat", "/resumen");
  assert.match(sender.last.text, /Ingresos: \$5,000\.00/);
  assert.match(sender.last.text, /Gastos: \$1,200\.00/);
  assert.match(sender.last.text, /Balance: \$3,800\.00/);
  assert.ok(sender.last.text.indexOf("Comida") < sender.last.text.indexOf("Transporte"));
});

test("/ayuda y un comando desconocido responden la ayuda sin registrar nada", async () => {
  const { ledger, sender, handler } = setup();
  await handler.execute("chat", "/ayuda");
  assert.match(sender.last.text, /Comandos:/);
  await handler.execute("chat", "/nose");
  assert.match(sender.last.text, /Comandos:/);
  assert.equal(ledger.transactions.size, 0);
});

test("una fecha al final del mensaje se usa como fecha del movimiento y no queda en la descripción", async () => {
  const { ledger, handler } = setup();
  await handler.execute("chat", "150 tacos 05/10/2026 #bbva");
  await handler.execute("chat", "80 café 3 de octubre #nu");

  const [first, second] = [...ledger.transactions.values()];
  assert.deepEqual([first.name, first.date], ["tacos", "2026-10-05"]);
  assert.deepEqual([second.name, second.date, second.accountId], ["café", "2026-10-03", 2]);
});

test("una fecha futura o inexistente se rechaza sin registrar", async () => {
  const { ledger, sender, handler } = setup();
  await handler.execute("chat", "150 tacos 31/02");
  assert.match(sender.last.text, /no existe/);
  await handler.execute("chat", "150 tacos 2099-01-01");
  assert.match(sender.last.text, /futura/);
  assert.equal(ledger.transactions.size, 0);
});

test("una cuenta que no existe responde con la lista de cuentas disponibles", async () => {
  const { sender, handler } = setup();
  await handler.execute("chat", "150 tacos #xyz");
  assert.match(sender.last.text, /Tus cuentas: BBVA, Nu/);
});

const actionsOf = (buttons?: TelegramButton[][]) => buttons?.flat().map((button) => decodeCallback(button.data)?.action);

test("sin pista de cuenta, el bot pregunta con botones (la última usada primero) y guarda un borrador: no registra nada todavía", async () => {
  const { ledger, sender, drafts, handler } = setup({ accountNames: ["BBVA", "Nu", "Efectivo"], lastUsedAccountId: 3 });
  await handler.execute("chat", "150 tacos");

  assert.match(sender.last.text, /¿En qué cuenta lo registro\?/);
  assert.equal(ledger.transactions.size, 0);
  assert.equal(drafts.items.size, 1);
  const labels = sender.last.buttons?.flat().map((button) => button.text);
  assert.deepEqual(labels, ["⭐ Efectivo", "BBVA", "Nu", "✖️ Cancelar"]);
});

test("elegir la cuenta registra el movimiento, edita la pregunta con el resultado y consume el borrador", async () => {
  const { ledger, sender, drafts, handler } = setup();
  await handler.execute("chat", "150 tacos");
  const pickNu = sender.last.buttons!.flat().find((button) => button.text === "Nu")!;
  await handler.handleCallback("chat", "cb", 9, pickNu.data);

  assert.equal(ledger.balanceOf(2), -15_000);
  assert.equal(drafts.items.size, 0);
  const edit = sender.log.filter((entry) => entry.kind === "edit").at(-1)!;
  assert.match(edit.text, /−\$150\.00 · tacos/);
  assert.match(edit.text, /🏦 Nu/);
  assert.equal([...ledger.transactions.values()][0].source, "telegram");

  await handler.handleCallback("chat", "cb2", 9, pickNu.data);
  assert.match(sender.last.text, /ya expiró o ya se registró/);
  assert.equal(ledger.transactions.size, 1);
});

test("cancelar descarta el borrador sin registrar nada", async () => {
  const { ledger, sender, drafts, handler } = setup();
  await handler.execute("chat", "150 tacos");
  const cancel = sender.last.buttons!.flat().find((button) => decodeCallback(button.data)?.action === "cancel")!;
  await handler.handleCallback("chat", "cb", 9, cancel.data);

  assert.equal(ledger.transactions.size, 0);
  assert.equal(drafts.items.size, 0);
  assert.match(sender.log.filter((entry) => entry.kind === "edit").at(-1)!.text, /Cancelado/);
});

test("si el texto nombra una sola cuenta con certeza, la usa sin preguntar; si nombra varias o ninguna distintiva, pregunta", async () => {
  const { ledger, sender, handler } = setup({ accountNames: ["BBVA", "Nu Ahorro", "Nu Débito"] });
  await handler.execute("chat", "150 tacos bbva");
  assert.equal(ledger.balanceOf(1), -15_000);

  await handler.execute("chat", "200 gasolina nu");
  assert.match(sender.last.text, /¿En qué cuenta lo registro\?/);
  await handler.execute("chat", "Compra con CUENTA en OXXO $50.00 06 octubre");
  assert.match(sender.last.text, /¿En qué cuenta lo registro\?/);
  assert.equal(ledger.transactions.size, 1);
});

test("un borrador ajeno (otro chat) no se puede usar", async () => {
  const { ledger, sender, handler } = setup();
  await handler.execute("chat", "150 tacos");
  const pick = sender.last.buttons!.flat()[0];
  await handler.handleCallback("otro-chat", "cb", 9, pick.data);
  assert.equal(ledger.transactions.size, 0);
});

test("'Ver todas' navega por las categorías: padres, luego sus subcategorías, y se puede elegir la subcategoría", async () => {
  const { ledger, sender, handler } = setup();
  await handler.execute("chat", "5000 renta #bbva");
  const txId = [...ledger.transactions.keys()][0];
  const showAll = sender.last.buttons!.flat().find((button) => decodeCallback(button.data)?.action === "nav")!;
  await handler.handleCallback("chat", "cb", 9, showAll.data);

  let edit = sender.log.filter((entry) => entry.kind === "edit").at(-1)!;
  assert.match(edit.text, /Todas las categorías/);
  assert.deepEqual(edit.buttons!.flat().map((button) => button.text).slice(0, 3), ["Comida", "Transporte", "📁 Vivienda"]);

  const openVivienda = edit.buttons!.flat().find((button) => button.text === "📁 Vivienda")!;
  await handler.handleCallback("chat", "cb2", 9, openVivienda.data);
  edit = sender.log.filter((entry) => entry.kind === "edit").at(-1)!;
  assert.match(edit.text, /Subcategorías de Vivienda/);
  assert.deepEqual(edit.buttons!.flat().map((button) => button.text).slice(0, 2), ["✅ Vivienda (general)", "Renta"]);

  const pickRenta = edit.buttons!.flat().find((button) => button.text === "Renta")!;
  await handler.handleCallback("chat", "cb3", 9, pickRenta.data);
  assert.equal(ledger.transactions.get(txId)?.categoryId, 13);
  assert.ok(actionsOf(sender.log.filter((entry) => entry.kind === "edit").at(-1)!.buttons)?.includes("undo"));
});
