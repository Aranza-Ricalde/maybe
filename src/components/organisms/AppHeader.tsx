"use client";

import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/molecules/ThemeToggle";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { pageTitleFor } from "@/lib/presenters/breadcrumb";
import { CommandPalette } from "./CommandPalette";
import { NotificationBell } from "./NotificationBell";
import { NAV_ITEMS } from "./navItems";

export function AppHeader() {
  const pathname = usePathname();
  const { open, setOpen } = useCommandPalette();

  return (
    <header className="flex h-14 max-md:hidden shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger aria-label="Contraer o expandir menú" className="-ml-1 hidden md:inline-flex" />
      <Separator orientation="vertical" className="mr-2 hidden data-vertical:h-4 data-vertical:self-auto md:block" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{pageTitleFor(pathname, NAV_ITEMS)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-1">
        <Button type="button" variant="outline" size="sm" className="hidden gap-2 text-muted-foreground sm:flex" aria-label="Buscar pantalla" onClick={() => setOpen(true)}>
          <Search />
          Buscar
          <kbd className="pointer-events-none rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">⌘K</kbd>
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" className="sm:hidden" aria-label="Buscar pantalla" onClick={() => setOpen(true)}>
          <Search />
        </Button>
        <NotificationBell />
        <ThemeToggle />
      </div>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </header>
  );
}
