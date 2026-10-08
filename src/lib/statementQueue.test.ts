import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_CONCURRENT_READS, nextToRead, queueProgress, queueReducer, type QueueAction, type QueueItem } from "./statementQueue";
import type { StatementPreview } from "@/domain/statements/reconcile";

const file = (name: string) => new File([new Uint8Array(4)], name, { type: "application/pdf" });
const preview = { rows: [{ defaultAction: "import", transaction: { type: "expense" } }] } as unknown as StatementPreview;
const run = (actions: QueueAction[], items: QueueItem[] = []) => actions.reduce(queueReducer, items);
const added = (...ids: string[]) => run([{ type: "add", files: ids.map((id) => ({ id, file: file(`${id}.pdf`) })) }]);
const statuses = (items: QueueItem[]) => items.map((i) => i.status);

test("al elegir banco y cuenta el archivo entra solo a la cola, sin otro clic", () => {
  const bankOnly = run([{ type: "configure", id: "a", bank: "nu_debito" }], added("a"));
  assert.equal(bankOnly[0].status, "configuring");
  const both = run([{ type: "configure", id: "a", bank: "nu_debito" }, { type: "configure", id: "a", accountId: 2 }], added("a"));
  assert.deepEqual([both[0].status, both[0].bank, both[0].accountId], ["queued", "nu_debito", 2]);
  const password = run([{ type: "configure", id: "a", bank: "nu_debito", accountId: 2 }, { type: "start", id: "a" }, { type: "failed", id: "a", message: "PDF protegido", needsPassword: true }, { type: "configure", id: "a", password: "x" }], added("a"));
  assert.equal(password[0].status, "password");
});

test("los archivos nuevos quedan por configurar y no entran a la cola sin banco y cuenta", () => {
  const items = run([{ type: "enqueue", id: "a" }, { type: "enqueueAll" }], added("a", "b"));
  assert.deepEqual(statuses(items), ["configuring", "configuring"]);
  const configured = run([{ type: "configure", id: "a", bank: "nu_debito", accountId: 2 }, { type: "enqueueAll" }], added("a", "b"));
  assert.deepEqual(statuses(configured), ["queued", "configuring"]);
});

test("configurar a todos solo afecta a los que siguen por configurar", () => {
  const items = run([{ type: "configure", id: "a", bank: "nu_debito", accountId: 2 }, { type: "enqueue", id: "a" }, { type: "configureAll", bank: "bbva_debito", accountId: 1 }], added("a", "b"));
  assert.deepEqual(items.map((i) => [i.bank, i.accountId]), [["nu_debito", 2], ["bbva_debito", 1]]);
});

test("se leen como máximo dos a la vez y el resto espera en cola", () => {
  const base = run([{ type: "configureAll", bank: "nu_debito", accountId: 2 }, { type: "enqueueAll" }], added("a", "b", "c"));
  const first = nextToRead(base);
  assert.equal(first.length, MAX_CONCURRENT_READS);
  const started = first.reduce<QueueItem[]>((acc, item) => queueReducer(acc, { type: "start", id: item.id }), base);
  assert.deepEqual(nextToRead(started), []);
  const finished = queueReducer(started, { type: "parsed", id: "a", preview });
  assert.deepEqual(nextToRead(finished).map((i) => i.id), ["c"]);
});

test("al leerse el estado se prepara la vista previa con las decisiones iniciales", () => {
  const items = run([{ type: "configure", id: "a", bank: "bbva_debito", accountId: 1 }, { type: "enqueue", id: "a" }, { type: "start", id: "a" }, { type: "parsed", id: "a", preview }], added("a"));
  assert.equal(items[0].status, "ready");
  assert.deepEqual(items[0].choices.map((c) => c.action), ["import"]);
});

test("un PDF protegido pide contraseña y al escribirla se puede reintentar", () => {
  const items = run([{ type: "configure", id: "a", bank: "bbva_debito", accountId: 1 }, { type: "enqueue", id: "a" }, { type: "start", id: "a" }, { type: "failed", id: "a", message: "PDF protegido", needsPassword: true }, { type: "configure", id: "a", password: "1234" }, { type: "enqueue", id: "a" }], added("a"));
  assert.deepEqual([items[0].status, items[0].password], ["queued", "1234"]);
});

test("un error se puede corregir cambiando el banco y volver a intentar", () => {
  const failed = run([{ type: "configure", id: "a", bank: "nu_debito", accountId: 2 }, { type: "enqueue", id: "a" }, { type: "start", id: "a" }, { type: "failed", id: "a", message: "Parece un estado de BBVA" }], added("a"));
  assert.deepEqual([failed[0].status, failed[0].message], ["error", "Parece un estado de BBVA"]);
  const fixed = run([{ type: "configure", id: "a", bank: "bbva_debito" }], failed);
  assert.deepEqual([fixed[0].status, fixed[0].message], ["queued", null]);
});

test("confirmar solo aplica a lo listo, un fallo lo deja listo con el mensaje y al terminar se libera la vista previa", () => {
  const ready = run([{ type: "configure", id: "a", bank: "bbva_debito", accountId: 1 }, { type: "enqueue", id: "a" }, { type: "start", id: "a" }, { type: "parsed", id: "a", preview }], added("a"));
  assert.equal(queueReducer(added("z"), { type: "confirming", id: "z" })[0].status, "configuring");
  const failed = run([{ type: "confirming", id: "a" }, { type: "confirmFailed", id: "a", message: "falló" }], ready);
  assert.deepEqual([failed[0].status, failed[0].message], ["ready", "falló"]);
  const done = run([{ type: "confirming", id: "a" }, { type: "confirmed", id: "a", result: { imported: 3, linked: 1, skipped: 0, paired: 0 } }], ready);
  assert.deepEqual([done[0].status, done[0].preview, done[0].result?.imported], ["done", null, 3]);
});

test("no se puede quitar un archivo que se está leyendo o importando, y limpiar quita solo los terminados", () => {
  const reading = run([{ type: "configure", id: "a", bank: "bbva_debito", accountId: 1 }, { type: "enqueue", id: "a" }, { type: "start", id: "a" }], added("a", "b"));
  assert.deepEqual(run([{ type: "remove", id: "a" }, { type: "remove", id: "b" }], reading).map((i) => i.id), ["a"]);
  const done = run([{ type: "parsed", id: "a", preview }, { type: "confirming", id: "a" }, { type: "confirmed", id: "a", result: { imported: 1, linked: 0, skipped: 0, paired: 0 } }, { type: "clearFinished" }], reading);
  assert.deepEqual(done.map((i) => i.id), ["b"]);
});

test("el progreso ignora los archivos sin configurar", () => {
  const items = run([{ type: "configure", id: "a", bank: "bbva_debito", accountId: 1 }, { type: "enqueue", id: "a" }, { type: "start", id: "a" }, { type: "parsed", id: "a", preview }], added("a", "b"));
  assert.deepEqual(queueProgress(items), { done: 1, total: 1 });
});

test("agrupa la cola por lo que el usuario debe hacer con cada archivo", async () => {
  const { groupQueue } = await import("./statementQueue");
  const make = (status: string) => ({ status }) as never;
  const grouped = groupQueue([make("configuring"), make("error"), make("ready"), make("confirming"), make("done"), make("reading")]);
  assert.equal(grouped.pending.length, 2);
  assert.equal(grouped.reviewable.length, 2);
  assert.equal(grouped.finished.length, 1);
});

test("el panel de progreso oculta lo que aún se configura y, en Importar, lo que ya no está ocupado", async () => {
  const { progressPanelState } = await import("./statementQueue");
  const make = (status: string) => ({ status }) as never;
  const items = [make("configuring"), make("reading"), make("done")];
  assert.equal(progressPanelState(items, false).visible.length, 2);
  assert.equal(progressPanelState(items, true).visible.length, 1);
  assert.equal(progressPanelState([make("done")], false).allDone, true);
  assert.equal(progressPanelState([make("ready")], false).needsReview, true);
});

test("el paso actual de importación sigue el avance de la cola", async () => {
  const { currentImportStep, groupQueue } = await import("./statementQueue");
  const step = (...statuses: string[]) => currentImportStep(groupQueue(statuses.map((status) => ({ status }) as never)));
  assert.equal(step(), 0);
  assert.equal(step("configuring"), 1);
  assert.equal(step("configuring", "ready"), 2);
  assert.equal(step("done"), 3);
});
