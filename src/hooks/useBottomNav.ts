import { usePathname } from "next/navigation";
import { useState } from "react";
import { partitionNav, type NavLike } from "@/lib/navigation";

export function useBottomNav<T extends NavLike>(items: T[]) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  return { ...partitionNav(items, pathname), isMoreOpen, setIsMoreOpen };
}
