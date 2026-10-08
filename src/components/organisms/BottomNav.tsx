"use client";

import { Ellipsis, LogOut } from "lucide-react";
import Link from "next/link";
import { LogoutForm } from "@/components/molecules/LogoutForm";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useBottomNav } from "@/hooks/useBottomNav";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./navItems";

const ITEM_BASE = "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors";
const itemTone = (active: boolean) => (active ? "text-primary" : "text-muted-foreground hover:text-foreground");

export function BottomNav() {
  const { bar, more, moreActive, isMoreOpen, setIsMoreOpen } = useBottomNav(NAV_ITEMS);

  return (
    <Drawer open={isMoreOpen} onOpenChange={setIsMoreOpen}>
      <nav aria-label="Navegación inferior" className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {bar.map((item) => {
          const { active } = item;
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn(ITEM_BASE, itemTone(active))}>
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
        <DrawerTrigger asChild>
          <button type="button" className={cn(ITEM_BASE, itemTone(moreActive))}>
            <Ellipsis className="size-5" />
            Más
          </button>
        </DrawerTrigger>
      </nav>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Más</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-1 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {more.map((item) => {
            const { active } = item;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setIsMoreOpen(false)}
                className={cn("flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium", active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted")}
              >
                <item.icon className="size-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          <LogoutForm>
            <Button type="submit" variant="ghost" className="min-h-12 w-full justify-start gap-3 px-3 text-sm font-medium">
              <LogOut className="size-5" />
              Salir
            </Button>
          </LogoutForm>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
