import { initialChoices, type RowChoice } from "@/domain/statements/decisions";
import type { StatementPreview } from "@/domain/statements/reconcile";
import type { StatementBank } from "@/domain/statements/types";

export type QueueStatus = "configuring" | "queued" | "reading" | "password" | "ready" | "confirming" | "done" | "error";

export interface ConfirmSummary {
  imported: number;
  linked: number;
  skipped: number;
  paired: number;
}

export interface QueueItem {
  id: string;
  file: File;
  bank: StatementBank | null;
  accountId: number | null;
  password: string;
  status: QueueStatus;
  message: string | null;
  preview: StatementPreview | null;
  choices: RowChoice[];
  acknowledgeMismatch: boolean;
  result: ConfirmSummary | null;
}

export type QueueAction =
  | { type: "add"; files: Array<{ id: string; file: File }> }
  | { type: "configure"; id: string; bank?: StatementBank | null; accountId?: number | null; password?: string }
  | { type: "configureAll"; bank: StatementBank | null; accountId: number | null }
  | { type: "enqueue"; id: string }
  | { type: "enqueueAll" }
  | { type: "start"; id: string }
  | { type: "parsed"; id: string; preview: StatementPreview }
  | { type: "failed"; id: string; message: string; needsPassword?: boolean }
  | { type: "setChoices"; id: string; choices: RowChoice[] }
  | { type: "acknowledge"; id: string; value: boolean }
  | { type: "confirming"; id: string }
  | { type: "confirmFailed"; id: string; message: string }
  | { type: "confirmed"; id: string; result: ConfirmSummary }
  | { type: "remove"; id: string }
  | { type: "clearFinished" };

export const MAX_CONCURRENT_READS = 2;

const isConfigured = (item: QueueItem) => item.bank !== null && item.accountId !== null;

function update(items: QueueItem[], id: string, change: (item: QueueItem) => Partial<QueueItem>): QueueItem[] {
  return items.map((item) => (item.id === id ? { ...item, ...change(item) } : item));
}

export function queueReducer(items: QueueItem[], action: QueueAction): QueueItem[] {
  switch (action.type) {
    case "add":
      return [...items, ...action.files.map(({ id, file }): QueueItem => ({ id, file, bank: null, accountId: null, password: "", status: "configuring", message: null, preview: null, choices: [], acknowledgeMismatch: false, result: null }))];
    case "configure":
      return update(items, action.id, (item) => {
        const bank = action.bank !== undefined ? action.bank : item.bank;
        const accountId = action.accountId !== undefined ? action.accountId : item.accountId;
        const changedTarget = action.bank !== undefined || action.accountId !== undefined;
        const autoStart = changedTarget && bank !== null && accountId !== null && (item.status === "configuring" || item.status === "error");
        return { bank, accountId, ...(action.password !== undefined ? { password: action.password } : {}), ...(autoStart ? { status: "queued" as const, message: null } : {}) };
      });
    case "configureAll":
      return items.map((item) => (item.status === "configuring" ? { ...item, bank: action.bank, accountId: action.accountId } : item));
    case "enqueue":
      return update(items, action.id, (item) => (isConfigured(item) && (item.status === "configuring" || item.status === "error" || item.status === "password") ? { status: "queued", message: null } : {}));
    case "enqueueAll":
      return items.map((item) => (item.status === "configuring" && isConfigured(item) ? { ...item, status: "queued", message: null } : item));
    case "start":
      return update(items, action.id, (item) => (item.status === "queued" ? { status: "reading" } : {}));
    case "parsed":
      return update(items, action.id, () => ({ status: "ready", preview: action.preview, choices: initialChoices(action.preview), acknowledgeMismatch: false, message: null }));
    case "failed":
      return update(items, action.id, () => ({ status: action.needsPassword ? "password" : "error", message: action.message }));
    case "setChoices":
      return update(items, action.id, () => ({ choices: action.choices }));
    case "acknowledge":
      return update(items, action.id, () => ({ acknowledgeMismatch: action.value }));
    case "confirming":
      return update(items, action.id, (item) => (item.status === "ready" ? { status: "confirming", message: null } : {}));
    case "confirmFailed":
      return update(items, action.id, () => ({ status: "ready", message: action.message }));
    case "confirmed":
      return update(items, action.id, () => ({ status: "done", result: action.result, message: null, preview: null, choices: [] }));
    case "remove":
      return items.filter((item) => item.id !== action.id || item.status === "reading" || item.status === "confirming");
    case "clearFinished":
      return items.filter((item) => item.status !== "done");
  }
}

export function nextToRead(items: QueueItem[]): QueueItem[] {
  const reading = items.filter((item) => item.status === "reading").length;
  return items.filter((item) => item.status === "queued").slice(0, Math.max(0, MAX_CONCURRENT_READS - reading));
}

export const isBusy = (item: QueueItem) => item.status === "queued" || item.status === "reading" || item.status === "confirming";

export const STATUS_LABEL: Record<QueueStatus, string> = {
  configuring: "Por configurar",
  queued: "En cola",
  reading: "Leyendo el estado…",
  password: "Necesita contraseña",
  ready: "Listo para revisar",
  confirming: "Importando…",
  done: "Importado",
  error: "No se pudo leer",
};

export function queueProgress(items: QueueItem[]): { done: number; total: number } {
  const relevant = items.filter((item) => item.status !== "configuring");
  return { done: relevant.filter((item) => item.status === "ready" || item.status === "done" || item.status === "error" || item.status === "password").length, total: relevant.length };
}
