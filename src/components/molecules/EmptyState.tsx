import type { ReactNode } from "react";
import { Text } from "@/components/atoms/Text";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Text weight="medium">{title}</Text>
      <Text tone="muted" className="max-w-sm">
        {description}
      </Text>
      {action}
    </div>
  );
}
