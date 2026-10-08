import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function DateTile({ isoDate, muted = false }: { isoDate: string; muted?: boolean }) {
  const [day, month] = formatShortDate(isoDate).split(" ");
  return (
    <div className={cn("flex h-12 w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border bg-muted/40", muted && "opacity-60")}>
      <span className="text-base leading-none font-semibold tabular-nums">{day}</span>
      <span className="text-[10px] leading-none text-muted-foreground uppercase">{month}</span>
    </div>
  );
}
