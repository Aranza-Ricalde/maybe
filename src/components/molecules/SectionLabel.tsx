import type { ReactNode } from "react";
import { Text } from "@/components/atoms/Text";
import { Separator } from "@/components/ui/separator";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <>
      <Separator className="mt-5 mb-4" />
      <Text weight="semibold" className="mb-3">
        {children}
      </Text>
    </>
  );
}
