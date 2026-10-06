import assert from "node:assert/strict";
import { test } from "node:test";
import type { NotificationExtractor } from "@/domain/captures/ports";
import type { CaptureMovementInput, CaptureMovementResult, CaptureMovementUseCase } from "./captureMovement";
import { CaptureNotificationUseCase, UnreadableNotificationError } from "./captureNotification";

function setup(extractor?: NotificationExtractor) {
  const calls: CaptureMovementInput[] = [];
  const capture = { execute: async (input: CaptureMovementInput) => (calls.push(input), { transactionId: 1 } as CaptureMovementResult) } as unknown as CaptureMovementUseCase;
  return { calls, useCase: new CaptureNotificationUseCase(capture, extractor) };
}

const BBVA = "Compra con TDD\nCompra con CUENTA en ANTHROPIC* CLAUDE $349.00 06 octubre 12:44h";

test("una notificación conocida se resuelve con reglas, sin consultar IA, y guarda el texto original en notas", async () => {
  let aiCalls = 0;
  const { calls, useCase } = setup({ extract: async () => (aiCalls++, null) });
  await useCase.execute(1, { name: "BBVA" }, BBVA);

  assert.equal(aiCalls, 0);
  assert.equal(calls[0].amountCents, 34_900);
  assert.equal(calls[0].description, "ANTHROPIC* CLAUDE");
  assert.deepEqual(calls[0].account, { name: "BBVA" });
  assert.equal(calls[0].notes, BBVA);
});

test("si las reglas no entienden, Gemini extrae el movimiento", async () => {
  const { calls, useCase } = setup({ extract: async () => ({ type: "income", amount: 500, description: "Reembolso", date: "2026-10-05" }) });
  await useCase.execute(1, { name: "BBVA" }, "te llegaron quinientos pesos de reembolso");

  assert.deepEqual([calls[0].type, calls[0].amountCents, calls[0].description, calls[0].date], ["income", 50_000, "Reembolso", "2026-10-05"]);
});

test("sin reglas y sin IA, con monto cero, fecha inválida o error de IA, se rechaza sin registrar", async () => {
  for (const extractor of [undefined, { extract: async () => null }, { extract: async () => ({ type: "expense" as const, amount: 0, description: "x" }) }, { extract: async () => ({ type: "expense" as const, amount: 5, description: "x", date: "2026-13-45" }) }, { extract: async () => { throw new Error("caído"); } }]) {
    const { calls, useCase } = setup(extractor);
    await assert.rejects(useCase.execute(1, { name: "BBVA" }, "texto sin sentido"), UnreadableNotificationError);
    assert.equal(calls.length, 0);
  }
});
