"use client";

import { X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { Text } from "@/components/atoms/Text";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ROUTES } from "@/domain/shared/routes";
import { useAutoClearFinished } from "@/hooks/useAutoClearFinished";
import { isBusy, progressPanelState, queueProgress, STATUS_LABEL, type QueueItem, type QueueStatus } from "@/lib/statementQueue";
import { useStatementImport } from "@/providers/StatementImportProvider";

const PROGRESS: Record<QueueStatus, number | null> = { configuring: 0, queued: 5, reading: null, password: 100, ready: 100, confirming: null, done: 100, error: 100 };
const BAR_VARIANT = { configuring: "default", queued: "default", reading: "default", password: "warning", ready: "success", confirming: "default", done: "success", error: "destructive" } as const satisfies Record<QueueStatus, string>;
const TEXT_TONE: Partial<Record<QueueStatus, string>> = { error: "text-danger", password: "text-warning", ready: "text-success", done: "text-success" };

function FileRow({ item }: { item: QueueItem }) {
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-sm">{item.file.name}</span>
        <span className={`shrink-0 text-xs font-medium ${TEXT_TONE[item.status] ?? "text-muted-foreground"}`}>{item.status === "done" ? "✓ Importado" : STATUS_LABEL[item.status]}</span>
      </div>
      <Progress value={PROGRESS[item.status]} variant={BAR_VARIANT[item.status]} aria-label={STATUS_LABEL[item.status]} />
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
  const { visible, allDone, busy, closable, needsReview } = progressPanelState(items, onImportPage);
  const clearFinished = useCallback(() => dispatch({ type: "clearFinished" }), [dispatch]);
  useAutoClearFinished(allDone, clearFinished);

  if (visible.length === 0) return null;
  const { done, total } = queueProgress(items);

  return (
    <aside aria-label="Progreso de importación" className="fixed inset-x-4 bottom-20 z-50 md:inset-x-auto md:bottom-4 md:right-4 md:w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      <div className="flex items-center gap-3 px-4 py-3">
        {busy ? <Spinner className="text-primary" /> : <span className={`flex size-5 items-center justify-center rounded-full text-xs text-white ${allDone ? "bg-success" : "bg-warning"}`}>{allDone ? "✓" : "!"}</span>}
        <div className="min-w-0 flex-1">
          <Text size="sm" weight="medium">
            {headline(visible)}
          </Text>
          <Text size="xs" tone="muted">
            {done} de {total} {total === 1 ? "archivo" : "archivos"}
          </Text>
        </div>
        <Button type="button" variant="ghost" size="xs" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "Mostrar" : "Ocultar"}
        </Button>
        {closable && (
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Cerrar" onClick={() => visible.forEach((item) => dispatch({ type: "remove", id: item.id }))}>
            <X />
          </Button>
        )}
      </div>
      <div className="px-4 pb-3">
        <Progress value={busy ? null : 100} variant={busy ? "default" : "success"} aria-label="Progreso total" className="h-1.5" />
      </div>
      {!collapsed && (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3">
          <ul className="flex max-h-60 flex-col gap-3 overflow-y-auto">
            {visible.map((item) => (
              <FileRow key={item.id} item={item} />
            ))}
          </ul>
          {needsReview && (
            <Link href={ROUTES.import} className="text-xs font-medium text-primary">
              Revisar en Importar estados
            </Link>
          )}
        </div>
      )}
    </aside>
  );
}
