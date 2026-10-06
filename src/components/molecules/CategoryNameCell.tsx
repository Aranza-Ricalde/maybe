export interface CategoryNameCellProps {
  name: string;
  color: string;
  depth: 0 | 1;
}

export function CategoryNameCell({ name, color, depth }: CategoryNameCellProps) {
  return (
    <div className={`flex items-center gap-2 ${depth === 1 ? "pl-6" : ""}`}>
      <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <span className="font-medium">{name}</span>
    </div>
  );
}
