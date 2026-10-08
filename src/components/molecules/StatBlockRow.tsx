import { Children, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const GRID_BY_COLUMNS: Record<number, { grid: string; divided: string }> = {
  3: { grid: "grid gap-6 sm:grid-cols-3", divided: "sm:border-l sm:pl-6" },
  4: { grid: "grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4 lg:gap-x-6", divided: "lg:border-l lg:pl-6" },
};

export function StatBlockRow({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  const layout = GRID_BY_COLUMNS[items.length] ?? GRID_BY_COLUMNS[3];

  return (
    <Card>
      <CardContent>
        <div className={layout.grid}>
          {items.map((item, i) => (
            <div key={i} className={cn("min-w-0", i > 0 && layout.divided)}>
              {item}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
