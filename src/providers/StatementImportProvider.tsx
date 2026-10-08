"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type Dispatch, type ReactNode } from "react";
import { notify } from "@/lib/notifications";
import { nextToRead, queueReducer, type QueueAction, type QueueItem } from "@/lib/statementQueue";
import { requestConfirm, requestParse } from "@/lib/statementsApi";

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
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const addFiles = useCallback((files: File[]) => {
    dispatch({ type: "add", files: files.map((file) => ({ id: crypto.randomUUID(), file })) });
  }, []);

  const read = useCallback(async (item: QueueItem) => {
    const outcome = await requestParse(item);
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
      if (!outcome.ok) {
        dispatch({ type: "confirmFailed", id, message: outcome.message });
        announce("danger", "No se importó el estado", `${item.file.name}: ${outcome.message}`);
        return;
      }
      dispatch({ type: "confirmed", id, result: outcome.result });
      announce("success", "Importación exitosa", `${item.file.name}: ${outcome.result.imported} importados, ${outcome.result.linked} vinculados.`);
      router.refresh();
    },
    [router],
  );

  const value = useMemo(() => ({ items, dispatch, addFiles, confirm }), [items, addFiles, confirm]);
  return <ImportContext.Provider value={value}>{children}</ImportContext.Provider>;
}

