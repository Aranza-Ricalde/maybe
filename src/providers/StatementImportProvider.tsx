"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type Dispatch, type ReactNode } from "react";
import type { StatementPreview } from "@/domain/statements/reconcile";
import { summarizeChoices, toDecisions } from "@/domain/statements/decisions";
import { notify } from "@/lib/notifications";
import { nextToRead, queueReducer, type QueueAction, type QueueItem } from "@/lib/statementQueue";

interface ImportContextValue {
  items: QueueItem[];
  dispatch: Dispatch<QueueAction>;
  addFiles: (files: File[]) => void;
  confirm: (id: string) => Promise<void>;
}

const ImportContext = createContext<ImportContextValue | null>(null);

export function useStatementImport(): ImportContextValue {
  const value = useContext(ImportContext);
  if (!value) throw new Error("useStatementImport requiere StatementImportProvider");
  return value;
}

function formFor(item: QueueItem): FormData {
  const form = new FormData();
  form.append("file", item.file);
  form.append("bank", item.bank ?? "");
  form.append("accountId", String(item.accountId ?? ""));
  if (item.password) form.append("password", item.password);
  return form;
}

function notifyDevice(title: string, body: string): void {
  if (typeof Notification === "undefined" || Notification.permission !== "granted" || !document.hidden) return;
  new Notification(title, { body });
}

function announce(kind: "success" | "danger" | "warning", title: string, description: string): void {
  const show = kind === "danger" ? notify.error : kind === "warning" ? notify.warning : notify.success;
  show(title, description);
  notifyDevice(title, description);
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function StatementImportProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(queueReducer, []);
  const router = useRouter();
  const started = useRef(new Set<string>());
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const addFiles = useCallback((files: File[]) => {
    dispatch({ type: "add", files: files.map((file) => ({ id: crypto.randomUUID(), file })) });
  }, []);

  const read = useCallback(async (item: QueueItem) => {
    try {
      const response = await fetch("/api/statements/parse", { method: "POST", body: formFor(item) });
      const body = await readJson(response);
      if (response.ok && body.preview) {
        const preview = body.preview as StatementPreview;
        dispatch({ type: "parsed", id: item.id, preview });
        announce("success", "Estado leído", `${item.file.name}: ${preview.rows.length} movimientos listos para revisar.`);
      } else {
        const message = String(body.mensaje ?? "No se pudo leer el estado.");
        dispatch({ type: "failed", id: item.id, message, needsPassword: body.error === "pdf_protegido" });
        announce("danger", "No se pudo leer el estado", `${item.file.name}: ${message}`);
      }
    } catch {
      dispatch({ type: "failed", id: item.id, message: "Falló la conexión al leer el estado." });
      announce("danger", "No se pudo leer el estado", `${item.file.name}: falló la conexión.`);
    }
  }, []);

  useEffect(() => {
    for (const item of nextToRead(items)) {
      if (started.current.has(item.id + item.password)) continue;
      started.current.add(item.id + item.password);
      dispatch({ type: "start", id: item.id });
      void read(item);
    }
  }, [items, read]);

  const confirm = useCallback(
    async (id: string) => {
      const item = itemsRef.current.find((candidate) => candidate.id === id);
      if (!item || item.status !== "ready" || !item.preview) return;
      dispatch({ type: "confirming", id });
      const form = formFor(item);
      form.append("decisions", JSON.stringify(toDecisions(item.preview, item.choices)));
      form.append("acknowledgeMismatch", String(item.acknowledgeMismatch));
      const summary = summarizeChoices(item.preview, item.choices);
      try {
        const response = await fetch("/api/statements/confirm", { method: "POST", body: form });
        const body = await readJson(response);
        if (!response.ok) {
          const message = String(body.mensaje ?? "No se pudo importar.");
          dispatch({ type: "confirmFailed", id, message });
          announce("danger", "No se importó el estado", `${item.file.name}: ${message}`);
          return;
        }
        dispatch({ type: "confirmed", id, result: { imported: Number(body.importados ?? summary.toImport), linked: Number(body.vinculados ?? summary.toLink), skipped: Number(body.omitidos ?? summary.toSkip), paired: Number(body.emparejados ?? summary.toPair) } });
        announce("success", "Importación exitosa", `${item.file.name}: ${Number(body.importados ?? summary.toImport)} importados, ${Number(body.vinculados ?? summary.toLink)} vinculados.`);
        router.refresh();
      } catch {
        dispatch({ type: "confirmFailed", id, message: "Falló la conexión al importar." });
        announce("danger", "No se importó el estado", `${item.file.name}: falló la conexión.`);
      }
    },
    [router],
  );

  const value = useMemo(() => ({ items, dispatch, addFiles, confirm }), [items, addFiles, confirm]);
  return (
    <ImportContext.Provider value={value}>
      {children}
    </ImportContext.Provider>
  );
}
