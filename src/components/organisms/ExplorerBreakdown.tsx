"use client";

import { Text } from "@/components/atoms/Text";
import { Progress } from "@/components/ui/progress";
import type { ExplorerShare } from "@/domain/explorer/rules";
import { formatPercent, formatPesos } from "@/lib/format";

export interface ExplorerBreakdownProps {
  title: string;
  shares: ExplorerShare[];
  onSelect?: (share: ExplorerShare) => void;
  selectLabel: (share: ExplorerShare) => string;
  footer?: string;
}

export function ExplorerBreakdown({ title, shares, onSelect, selectLabel, footer }: ExplorerBreakdownProps) {
  const max = shares[0]?.totalCents ?? 0;
  if (shares.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <Text tone="muted">{footer ? "Ningún gasto con comercio identificado con estos filtros." : "Sin gasto con estos filtros."}</Text>
        {footer && (
          <Text size="xs" tone="muted">
            {footer}
          </Text>
        )}
      </div>
    );
  }

  return (
    <ul aria-label={title} className="flex flex-col gap-1">
      {shares.map((share) => {
        const selectable = onSelect != null && share.key !== "others" && (share.categoryId != null || share.color == null);
        const content = (
          <>
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: share.color ?? "var(--muted-foreground)" }} />
              <span className="truncate text-sm font-medium">{share.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{share.count === 1 ? "1 mov." : `${share.count} mov.`}</span>
            </span>
            <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
              {formatPesos(share.totalCents)} · {formatPercent(share.share)}
            </span>
            <Progress value={max > 0 ? (share.totalCents / max) * 100 : 0} indicatorColor={share.color ?? undefined} aria-label={share.name} className="col-span-2 h-1.5" />
          </>
        );
        return (
          <li key={share.key}>
            {selectable ? (
              <button type="button" aria-label={selectLabel(share)} onClick={() => onSelect(share)} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted">
                {content}
              </button>
            ) : (
              <div className="grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 px-2 py-1.5">{content}</div>
            )}
          </li>
        );
      })}
      {footer && (
        <Text size="xs" tone="muted" className="px-2 pt-2">
          {footer}
        </Text>
      )}
    </ul>
  );
}
