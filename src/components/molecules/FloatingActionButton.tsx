"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function FloatingActionButton({ href, label, hiddenOn = [] }: { href: string; label: string; hiddenOn?: readonly string[] }) {
  const pathname = usePathname();
  if (pathname === href.split("?")[0] || hiddenOn.some((route) => pathname.startsWith(route))) return null;

  return (
    <Link href={href} aria-label={label} className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 md:hidden">
      <Plus className="size-6" aria-hidden />
    </Link>
  );
}
