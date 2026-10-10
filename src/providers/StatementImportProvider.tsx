"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type Dispatch, type ReactNode } from "react";
import { notify } from "@/lib/notifications";
import { nextToRead, queueReducer, type QueueAction, type QueueItem } from "@/lib/statementQueue";
import type { StatementBank } from "@/domain/statements/types";
import { requestConfirm, requestParse, requestUndo } from "@/lib/statementsApi";

interface ImportContextValue {
  items: QueueItem[];
  dispatch: Dispatch<QueueAction>;
  addFiles: (files: File[], preset?: { bank: StatementBank; accountId: number; inboxId?: number }) => void;
  confirm: (id: string) => Promise<void>;
  cancel: (id: string) => void;
  undo: (id: string) => Promise<void>;
}

const ImportContext = createContext<ImportContextValue | null>(null);

export function useStatementImport(): ImportContextValue {
  const value = useContext(ImportContext);
  if (!value) throw new Error("useStatementImport requiere StatementImportProvider");
  return value;
}

function notifyDevice(title: string, body: string): void {
  if (typeof Notification === "undefined" || Notification.permission !== "granted" || !document.hidden) return;
  new Notification(title, { body });
}

function announce(kind: "success" | "danger", title: string, description: string): void {
  (kind === "danger" ? notify.error : notify.success)(title, description);
  notifyDevice(title, description);
}

export function StatementImportProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(queueReducer, []);
  const router = useRouter();
  const started = useRef(new Set<string>());
  const controllers = useRef(new Map<string, AbortController>());
  const cancelRequests = useRef(new Set<string>());
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const addFiles = useCallback((files: File[], preset?: { bank: StatementBank; accountId: number; inboxId?: number }) => {
    dispatch({ type: "add", files: files.map((file) => ({ id: crypto.randomUUID(), file, ...preset })) });
  }, []);

  const read = useCallback(async (item: QueueItem) => {
    const controller = new AbortController();
    controllers.current.set(item.id, controller);
    const outcome = await requestParse(item, controller.signal);
    controllers.current.delete(item.id);
    if (!outcome.ok && outcome.cancelled) return;
    if (outcome.ok) {
      dispatch({ type: "parsed", id: item.id, preview: outcome.preview });
      announce("success", "Estado leído", `${item.file.name}: ${outcome.preview.rows.length} movimientos listos para revisar.`);
      return;
    }
    dispatch({ type: "failed", id: item.id, message: outcome.message, needsPassword: outcome.needsPassword });
    announce("danger", "No se pudo leer el estado", `${item.file.name}: ${outcome.message}`);
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
      const outcome = await requestConfirm({ ...item, preview: item.preview });
      const cancelRequested = cancelRequests.current.delete(id);
      if (!outcome.ok) {
        dispatch({ type: "confirmFailed", id, message: outcome.message });
        announce("danger", "No se importó el estado", `${item.file.name}: ${outcome.message}`);
        return;
      }
      if (cancelRequested && outcome.result.importId != null) {
        const undone = await requestUndo(outcome.result.importId);
        if (undone.ok) {
          dispatch({ type: "cancel", id });
          announce("success", "Importación cancelada", `${item.file.name}: se restauró todo como estaba.`);
          router.refresh();
          return;
        }
        announce("danger", "No se pudo cancelar", `${item.file.name}: ${undone.message}`);
      }
      dispatch({ type: "confirmed", id, result: outcome.result });
      announce("success", "Importación exitosa", `${item.file.name}: ${outcome.result.imported} importados, ${outcome.result.linked} vinculados.`);
      router.refresh();
    },
    [router],
  );

  const cancel = useCallback((id: string) => {
    const current = itemsRef.current.find((candidate) => candidate.id === id);
    if (current?.status === "confirming") {
      cancelRequests.current.add(id);
      notify.success("Cancelando importación", "Se revertirá en cuanto termine de guardarse.");
      return;
    }
    controllers.current.get(id)?.abort();
    controllers.current.delete(id);
    started.current.forEach((key) => {
      if (key.startsWith(id)) started.current.delete(key);
    });
    dispatch({ type: "cancel", id });
    notify.success("Importación cancelada", "No se guardó ningún cambio.");
  }, []);

  const undo = useCallback(
    async (id: string) => {
      const item = itemsRef.current.find((candidate) => candidate.id === id);
      const importId = item?.result?.importId;
      if (!item || importId == null) return;
      const outcome = await requestUndo(importId);
      if (!outcome.ok) {
        announce("danger", "No se pudo deshacer", outcome.message);
        return;
      }
      dispatch({ type: "remove", id });
      announce("success", "Importación deshecha", `${item.file.name}: se restauró todo como estaba.`);
      router.refresh();
    },
    [router],
  );

  const value = useMemo(() => ({ items, dispatch, addFiles, confirm, cancel, undo }), [items, addFiles, confirm, cancel, undo]);
  return <ImportContext.Provider value={value}>{children}</ImportContext.Provider>;
}

