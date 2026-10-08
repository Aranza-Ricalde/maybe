import { cn } from "@/lib/utils";

export interface SeriesLegendItem {
  key: string;
  label: string;
  color: string;
  value?: string | null;
  dashed?: boolean;
}

export interface SeriesLegendProps {
  items: SeriesLegendItem[];
  onSelect?: (key: string) => void;
  className?: string;
}

export function SeriesLegend({ items, onSelect, className }: SeriesLegendProps) {
  if (items.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-sm", className)}>
      {items.map((item) => {
        const content = (
          <>
            {item.dashed ? <span className="w-4 shrink-0 border-t-2 border-dashed" style={{ borderColor: item.color }} aria-hidden /> : <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: item.color }} aria-hidden />}
            <span>{item.label}</span>
            {item.value && <span className="font-semibold tabular-nums">{item.value}</span>}
          </>
        );
        return (
          <li key={item.key}>
            {onSelect ? (
              <button type="button" onClick={() => onSelect(item.key)} className="flex items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:bg-muted">
                {content}
              </button>
            ) : (
              <span className="flex items-center gap-1.5 px-1 py-0.5">{content}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
