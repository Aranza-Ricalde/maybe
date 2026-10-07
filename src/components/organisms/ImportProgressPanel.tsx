"use client";

import { CloseButton, Spinner } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Text } from "@/components/atoms/Text";
import { ROUTES } from "@/domain/shared/routes";
import { isBusy, queueProgress, STATUS_LABEL, type QueueItem, type QueueStatus } from "@/lib/statementQueue";
import { useStatementImport } from "./StatementImportProvider";

const AUTO_CLOSE_MS = 4000;

const PROGRESS: Record<QueueStatus, number | null> = { configuring: 0, queued: 5, reading: null, password: 100, ready: 100, confirming: null, done: 100, error: 100 };
const BAR_TONE: Partial<Record<QueueStatus, string>> = { error: "bg-danger", password: "bg-warning", ready: "bg-success", done: "bg-success" };
const TEXT_TONE: Partial<Record<QueueStatus, string>> = { error: "text-danger", password: "text-warning", ready: "text-success", done: "text-success" };

function ProgressBar({ status, label, height = "h-1" }: { status: QueueStatus; label: string; height?: string }) {
  const value = PROGRESS[status];
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value ?? undefined} className={`${height} w-full overflow-hidden rounded-full bg-separator`}>
      <div className={`h-full rounded-full transition-all ${BAR_TONE[status] ?? "bg-accent"} ${value === null ? "w-1/3 animate-pulse" : ""}`} style={value === null ? undefined : { width: `${value}%` }} />
    </div>
  );
}

function FileRow({ item }: { item: QueueItem }) {
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-sm">{item.file.name}</span>
        <span className={`shrink-0 text-xs font-medium ${TEXT_TONE[item.status] ?? "text-muted"}`}>{item.status === "done" ? "✓ Importado" : STATUS_LABEL[item.status]}</span>
      </div>
      <ProgressBar status={item.status} label={STATUS_LABEL[item.status]} />
    </li>
  );
}

function headline(items: QueueItem[]): string {
  if (items.some(isBusy)) return "Importando estados";
  if (items.every((item) => item.status === "done")) return "Importación completa";
  return "Revisa tus estados";
}

export function ImportProgressPanel() {
  const { items, dispatch } = useStatementImport();
  const [collapsed, setCollapsed] = useState(false);
  const onImportPage = usePathname().startsWith(ROUTES.import);
  const visible = items.filter((item) => item.status !== "configuring" && (!onImportPage || isBusy(item)));
  const allDone = visible.length > 0 && visible.every((item) => item.status === "done");

  useEffect(() => {
    if (!allDone) return;
    const timer = setTimeout(() => dispatch({ type: "clearFinished" }), AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [allDone, dispatch]);

  if (visible.length === 0) return null;
  const { done, total } = queueProgress(items);
  const busy = visible.some(isBusy);
  const closable = visible.every((item) => item.status === "done" || item.status === "error");
  const needsReview = visible.some((item) => item.status === "ready" || item.status === "password" || item.status === "error");

  return (
    <aside aria-label="Progreso de importación" className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-separator bg-surface shadow-xl">
      <div className="flex items-center gap-3 px-4 py-3">
        {busy ? <Spinner size="sm" /> : <span className={`flex size-5 items-center justify-center rounded-full text-xs text-white ${allDone ? "bg-success" : "bg-warning"}`}>{allDone ? "✓" : "!"}</span>}
        <div className="min-w-0 flex-1">
          <Text size="sm" weight="medium">
            {headline(visible)}
          </Text>
          <Text size="xs" tone="muted">
            {done} de {total} {total === 1 ? "archivo" : "archivos"}
          </Text>
        </div>
        <button type="button" className="text-xs text-muted hover:text-foreground" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "Mostrar" : "Ocultar"}
        </button>
        {closable && <CloseButton aria-label="Cerrar" onPress={() => visible.forEach((item) => dispatch({ type: "remove", id: item.id }))} />}
      </div>
      <div className="px-4 pb-3">
        <ProgressBar status={busy ? "reading" : "done"} label="Progreso total" height="h-1.5" />
      </div>
      {!collapsed && (
        <div className="flex flex-col gap-3 border-t border-separator px-4 py-3">
          <ul className="flex max-h-60 flex-col gap-3 overflow-y-auto">
            {visible.map((item) => (
              <FileRow key={item.id} item={item} />
            ))}
          </ul>
          {needsReview && (
            <Link href={ROUTES.import} className="text-xs font-medium text-accent">
              Revisar en Importar estados
            </Link>
          )}
        </div>
      )}
    </aside>
  );
}
