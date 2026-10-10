import { summarizeChoices, toDecisions } from "@/domain/statements/decisions";
import type { StatementPreview } from "@/domain/statements/reconcile";
import type { ConfirmSummary, QueueItem } from "./statementQueue";

export type ParseOutcome = { ok: true; preview: StatementPreview } | { ok: false; message: string; needsPassword: boolean; cancelled?: boolean };
export type ConfirmOutcome = { ok: true; result: ConfirmSummary } | { ok: false; message: string; cancelled?: boolean };
export type UndoOutcome = { ok: true } | { ok: false; message: string };

const isAbort = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

type JsonBody = Record<string, unknown>;

function formFor(item: QueueItem): FormData {
  const form = new FormData();
  form.append("file", item.file);
  form.append("bank", item.bank ?? "");
  form.append("accountId", String(item.accountId ?? ""));
  if (item.password) form.append("password", item.password);
  return form;
}

async function readJson(response: Response): Promise<JsonBody> {
  try {
    return (await response.json()) as JsonBody;
  } catch {
    return {};
  }
}

export function confirmResultFrom(body: JsonBody, fallback: { toImport: number; toLink: number; toSkip: number; toPair: number }): ConfirmSummary {
  return {
    importId: typeof body.importId === "number" ? body.importId : null,
    imported: Number(body.importados ?? fallback.toImport),
    linked: Number(body.vinculados ?? fallback.toLink),
    skipped: Number(body.omitidos ?? fallback.toSkip),
    paired: Number(body.emparejados ?? fallback.toPair),
  };
}

export async function requestParse(item: QueueItem, signal?: AbortSignal): Promise<ParseOutcome> {
  try {
    const response = await fetch("/api/statements/parse", { method: "POST", body: formFor(item), signal });
    const body = await readJson(response);
    if (response.ok && body.preview) return { ok: true, preview: body.preview as StatementPreview };
    return { ok: false, message: String(body.mensaje ?? "No se pudo leer el estado."), needsPassword: body.error === "pdf_protegido" };
  } catch (error) {
    if (isAbort(error)) return { ok: false, message: "Lectura cancelada.", needsPassword: false, cancelled: true };
    return { ok: false, message: "Falló la conexión al leer el estado.", needsPassword: false };
  }
}

export async function requestConfirm(item: QueueItem & { preview: StatementPreview }, signal?: AbortSignal): Promise<ConfirmOutcome> {
  const form = formFor(item);
  form.append("decisions", JSON.stringify(toDecisions(item.preview, item.choices)));
  form.append("acknowledgeMismatch", String(item.acknowledgeMismatch));
  const summary = summarizeChoices(item.preview, item.choices);
  try {
    const response = await fetch("/api/statements/confirm", { method: "POST", body: form, signal });
    const body = await readJson(response);
    if (!response.ok) return { ok: false, message: String(body.mensaje ?? "No se pudo importar.") };
    return { ok: true, result: confirmResultFrom(body, summary) };
  } catch (error) {
    if (isAbort(error)) return { ok: false, message: "Importación cancelada.", cancelled: true };
    return { ok: false, message: "Falló la conexión al importar." };
  }
}

export async function requestUndo(importId: number): Promise<UndoOutcome> {
  try {
    const response = await fetch("/api/statements/undo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ importId }) });
    const body = await readJson(response);
    if (!response.ok) return { ok: false, message: String(body.mensaje ?? "No se pudo deshacer la importación.") };
    return { ok: true };
  } catch {
    return { ok: false, message: "Falló la conexión al deshacer la importación." };
  }
}
