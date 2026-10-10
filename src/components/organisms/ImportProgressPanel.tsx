"use client";

import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { Text } from "@/components/atoms/Text";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ROUTES } from "@/domain/shared/routes";
import { useAutoClearFinished } from "@/hooks/useAutoClearFinished";
import { useDraggableBubble } from "@/hooks/useDraggableBubble";
import { isBusy, progressPanelState, queueProgress, STATUS_LABEL, type QueueItem, type QueueStatus } from "@/lib/statementQueue";
import { useStatementImport } from "@/providers/StatementImportProvider";

const PROGRESS: Record<QueueStatus, number | null> = { configuring: 0, queued: 5, reading: null, password: 100, ready: 100, confirming: null, done: 100, error: 100 };
const BAR_VARIANT = { configuring: "default", queued: "default", reading: "default", password: "warning", ready: "success", confirming: "default", done: "success", error: "destructive" } as const satisfies Record<QueueStatus, string>;
const TEXT_TONE: Partial<Record<QueueStatus, string>> = { error: "text-danger", password: "text-warning", ready: "text-success", done: "text-success" };

function FileRow({ item, onCancel }: { item: QueueItem; onCancel: () => void }) {
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-sm">{item.file.name}</span>
        <span className={`shrink-0 text-xs font-medium ${TEXT_TONE[item.status] ?? "text-muted-foreground"}`}>{item.status === "done" ? "✓ Importado" : STATUS_LABEL[item.status]}</span>
      </div>
      {isBusy(item) && <Progress value={PROGRESS[item.status]} variant={BAR_VARIANT[item.status]} aria-label={STATUS_LABEL[item.status]} />}
      {isBusy(item) && (
        <Button type="button" variant="ghost" size="xs" className="self-end text-muted-foreground" onClick={onCancel}>
          Cancelar
        </Button>
      )}
    </li>
  );
}

function headline(items: QueueItem[]): string {
  if (items.some(isBusy)) return "Importando estados";
  if (items.every((item) => item.status === "done")) return "Importación completa";
  return "Revisa tus estados";
}

const BUBBLE_SIZE = { width: 52, height: 52 };

interface ImportProgressBubbleProps {
  busy: boolean;
  allDone: boolean;
  done: number;
  total: number;
  onOpen: () => void;
}

function ImportProgressBubble({ busy, allDone, done, total, onOpen }: ImportProgressBubbleProps) {
  const { element, position, isDragging, handlers } = useDraggableBubble(BUBBLE_SIZE, onOpen);
  const placement = position ? { left: position.x, top: position.y } : { right: 16, bottom: 96 };
  return (
    <button
      ref={element}
      type="button"
      aria-label={`Importación en curso: ${done} de ${total}. Toca para abrir o arrastra para mover`}
      style={{ ...placement, width: BUBBLE_SIZE.width, height: BUBBLE_SIZE.height, touchAction: "none" }}
      className={`fixed z-50 flex touch-none items-center justify-center rounded-full border border-border bg-card select-none md:hidden ${isDragging ? "shadow-2xl ring-2 ring-primary/30" : "shadow-xl"}`}
      {...handlers}
    >
      {busy ? <Spinner className="size-6 text-primary" /> : <span className={`flex size-6 items-center justify-center rounded-full text-xs text-white ${allDone ? "bg-success" : "bg-warning"}`}>{allDone ? "✓" : "!"}</span>}
      <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] leading-5 font-semibold text-background tabular-nums">
        {done}/{total}
      </span>
    </button>
  );
}

export function ImportProgressPanel() {
  const { items, dispatch, cancel } = useStatementImport();
  const [collapsed, setCollapsed] = useState(false);
  const onImportPage = usePathname().startsWith(ROUTES.import);
  const { visible, allDone, busy, needsReview } = progressPanelState(items, onImportPage);
  const clearFinished = useCallback(() => dispatch({ type: "clearFinished" }), [dispatch]);
  useAutoClearFinished(allDone && !onImportPage, clearFinished);

  if (visible.length === 0) return null;
  const { done, total } = queueProgress(items);

  return (
    <>
    {collapsed && <ImportProgressBubble busy={busy} allDone={allDone} done={done} total={total} onOpen={() => setCollapsed(false)} />}
    <aside aria-label="Progreso de importación" className={`fixed inset-x-4 bottom-20 z-50 md:inset-x-auto md:bottom-4 md:right-4 md:w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-xl ${collapsed ? "max-md:hidden" : ""}`}>
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
      </div>
      {busy && (
        <div className="px-4 pb-3">
          <Progress value={null} variant="default" aria-label="Progreso total" className="h-1.5" />
        </div>
      )}
      {!collapsed && (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3">
          <ul className="flex max-h-60 flex-col gap-3 overflow-y-auto">
            {visible.map((item) => (
              <FileRow key={item.id} item={item} onCancel={() => cancel(item.id)} />
            ))}
          </ul>
          {needsReview && (
            <Button size="sm" nativeButton={false} render={<Link href={ROUTES.import} />}>
              Revisar estados
            </Button>
          )}
        </div>
      )}
    </aside>
    </>
  );
}
