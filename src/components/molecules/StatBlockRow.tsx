import { Children, type ReactNode } from "react";
import { Card } from "@heroui/react";

export function StatBlockRow({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  const last = items.length - 1;

  return (
    <Card className="p-5">
      <div className="grid grid-cols-1 divide-y divide-separator sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((item, i) => (
          <div key={i} className={i === 0 ? "sm:pr-5" : i === last ? "pt-4 sm:pt-0 sm:pl-5" : "pt-4 sm:px-5 sm:pt-0"}>
            {item}
          </div>
        ))}
      </div>
    </Card>
  );
}
