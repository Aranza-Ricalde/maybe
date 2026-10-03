import type { ReactNode } from "react";
import { Text } from "@/components/atoms/Text";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Text weight="semibold" className="mb-3 border-t border-separator pt-5">
      {children}
    </Text>
  );
}
