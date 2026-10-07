import { Children, type ReactNode } from "react";
import { Card } from "@heroui/react";

const GRID_BY_COLUMNS: Record<number, { grid: string; first: string; middle: string; last: string }> = {
  3: {
    grid: "grid grid-cols-1 divide-y divide-separator sm:grid-cols-3 sm:divide-x sm:divide-y-0",
    first: "sm:pr-5",
    middle: "pt-4 sm:px-5 sm:pt-0",
    last: "pt-4 sm:pt-0 sm:pl-5",
  },
  4: {
    grid: "grid grid-cols-1 gap-y-4 divide-y divide-separator sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:gap-y-0 lg:divide-x",
    first: "sm:pr-5 lg:pr-5",
    middle: "pt-4 sm:pt-0 sm:pl-5 lg:px-5",
    last: "pt-4 sm:pt-0 sm:pl-5 lg:pl-5",
  },
};

export function StatBlockRow({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  const last = items.length - 1;
  const layout = GRID_BY_COLUMNS[items.length] ?? GRID_BY_COLUMNS[3];

  return (
    <Card className="p-5">
      <div className={layout.grid}>
        {items.map((item, i) => (
          <div key={i} className={i === 0 ? layout.first : i === last ? layout.last : layout.middle}>
            {item}
          </div>
        ))}
      </div>
    </Card>
  );
}
