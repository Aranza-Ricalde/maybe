import assert from "node:assert/strict";
import { test } from "node:test";
import { CaptureAccountNotFoundError } from "@/domain/captures/rules";
import type { PlannedNotification } from "@/domain/notifications/rules";
import type { InboxStatementInput } from "@/domain/statements/inbox";
import { InvalidInboxStatementError } from "@/domain/statements/inbox";
import { ReceiveStatementUseCase } from "./receiveStatement";

const pdf = Uint8Array.from(Buffer.from("%PDF-1.4 contenido"));

function build(accountNames = ["BBVA", "Nu Débito"]) {
  const stored: InboxStatementInput[] = [];
  const notified: PlannedNotification[] = [];
  const delivered: string[] = [];
  const hashes = new Set<string>();
  const accounts = { listActive: async () => accountNames.map((name, index) => ({ id: index + 1, name })) as never };
  const inbox = {
    insertIfNew: async (_family: number, input: InboxStatementInput) => {
      const key = Buffer.from(input.data).toString("hex");
      if (hashes.has(key)) return null;
      hashes.add(key);
      stored.push(input);
      return stored.length;
    },
  } as never;
  const notifications = { insertIfNew: async (_family: number, n: PlannedNotification) => (notified.push(n), notified.length), markSent: async () => {} };
  const channel = { deliver: async (_family: number, n: { title: string }) => void delivered.push(n.title) };
  return { useCase: new ReceiveStatementUseCase(accounts, inbox, notifications, channel), stored, notified, delivered };
}

const input = { familyId: 1, bank: "bbva_debito", accountName: "bbva", filename: "1568871032_202610.pdf", data: pdf, fromAddress: "clientes@bbva.mx", subject: "Atención a Clientes BBVA", receivedAt: null };

test("guarda el estado, resuelve la cuenta sin importar mayúsculas y avisa", async () => {
  const { useCase, stored, notified, delivered } = build();
  const result = await useCase.execute(input);
  assert.deepEqual(result, { status: "received", id: 1, accountName: "BBVA" });
  assert.equal(stored[0].accountId, 1);
  assert.equal(notified[0].kind, "statement_ready");
  assert.equal(notified[0].href, "/import");
  assert.equal(delivered.length, 1);
});

test("un archivo repetido no se guarda ni avisa dos veces", async () => {
  const { useCase, delivered } = build();
  await useCase.execute(input);
  assert.deepEqual(await useCase.execute(input), { status: "duplicate" });
  assert.equal(delivered.length, 1);
});

test("rechaza bancos desconocidos, archivos que no son PDF y cuentas inexistentes", async () => {
  const { useCase } = build();
  await assert.rejects(() => useCase.execute({ ...input, bank: "otro" }), InvalidInboxStatementError);
  await assert.rejects(() => useCase.execute({ ...input, data: Uint8Array.from(Buffer.from("no pdf")) }), InvalidInboxStatementError);
  await assert.rejects(() => useCase.execute({ ...input, accountName: "Inexistente" }), CaptureAccountNotFoundError);
});
