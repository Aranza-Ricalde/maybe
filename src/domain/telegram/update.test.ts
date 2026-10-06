import assert from "node:assert/strict";
import { test } from "node:test";
import { parseTelegramUpdate } from "./update";
import { parseLinkCommand } from "./rules";

test("parseTelegramUpdate: extrae chat, texto y update_id", () => {
  assert.deepEqual(parseTelegramUpdate({ update_id: 7, message: { chat: { id: 123 }, text: "150 tacos" } }), { kind: "message", updateId: 7, chatId: "123", text: "150 tacos" });
});

test("parseTelegramUpdate: rechaza formas inesperadas sin lanzar", () => {
  assert.equal(parseTelegramUpdate(null), null);
  assert.equal(parseTelegramUpdate({ message: { chat: {}, text: "x" } }), null);
  assert.equal(parseTelegramUpdate({ message: { chat: { id: 1 }, text: 5 } }), null);
  assert.equal(parseTelegramUpdate("hola"), null);
});

test("parseTelegramUpdate: recorta textos larguísimos", () => {
  assert.equal((parseTelegramUpdate({ message: { chat: { id: 1 }, text: "a".repeat(5000) } }) as { text: string }).text.length, 1000);
});

test("parseLinkCommand: reconoce /start y /link con o sin código", () => {
  assert.deepEqual(parseLinkCommand("/link ABC123"), { code: "ABC123" });
  assert.deepEqual(parseLinkCommand(" /start "), { code: null });
  assert.equal(parseLinkCommand("150 tacos"), null);
});

test("parseTelegramUpdate: lee la pulsación de un botón con su mensaje", () => {
  const payload = { update_id: 9, callback_query: { id: "cb1", data: "ok:5", message: { message_id: 44, chat: { id: 123 } } } };
  assert.deepEqual(parseTelegramUpdate(payload), { kind: "callback", updateId: 9, chatId: "123", callbackId: "cb1", messageId: 44, data: "ok:5" });
  assert.equal(parseTelegramUpdate({ callback_query: { id: "x", message: { message_id: 1, chat: { id: 1 } } } }), null);
});
