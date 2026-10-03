import type { StatusLevel } from "./StatusTheme";

const DOT_COLORS: Record<StatusLevel, string> = { green: "bg-success", yellow: "bg-warning", red: "bg-danger" };

export function StatusDot({ level }: { level: StatusLevel }) {
  return <span aria-hidden="true" className={`inline-block size-2.5 shrink-0 rounded-full ${DOT_COLORS[level]}`} />;
}
