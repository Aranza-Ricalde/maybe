"use client";

import { ArrowRightFromSquare, ChevronsLeft, ChevronsRight } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/atoms/Icon";
import { Text } from "@/components/atoms/Text";

const NAV_ITEMS: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/", label: "Resumen", icon: <HomeIcon /> },
  { href: "/accounts", label: "Cuentas", icon: <WalletIcon /> },
  { href: "/transactions", label: "Movimientos", icon: <ListIcon /> },
  { href: "/budgets", label: "Presupuestos", icon: <PieIcon /> },
  { href: "/recurring", label: "Recurrentes", icon: <RepeatIcon /> },
  { href: "/goals", label: "Metas", icon: <FlagIcon /> },
  { href: "/settings", label: "Configuración", icon: <GearIcon /> },
];

function SidebarLabel({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  return (
    <span className={`overflow-hidden whitespace-nowrap transition-all duration-200 ease-in-out ${collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100"}`}>
      {children}
    </span>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <nav
      className={`relative flex h-full shrink-0 flex-col gap-1 border-r border-separator bg-surface p-4 transition-[width] duration-200 ease-in-out ${collapsed ? "w-[72px]" : "w-60"}`}
    >
      <div className={`mb-4 flex items-center px-3 ${collapsed ? "justify-center gap-0" : "gap-2"}`}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">M</span>
        <SidebarLabel collapsed={collapsed}>
          <span className="text-lg font-semibold">Maybe</span>
        </SidebarLabel>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${collapsed ? "justify-center gap-0" : "gap-3"} ${
                active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-secondary hover:text-foreground"
              }`}
            >
              <span className="h-4 w-4 shrink-0">{item.icon}</span>
              <SidebarLabel collapsed={collapsed}>{item.label}</SidebarLabel>
            </Link>
          );
        })}
      </div>

      <div className={`flex items-center gap-3 rounded-lg border-t border-separator px-3 pt-3 ${collapsed ? "justify-center" : ""}`}>
        <form method="POST" action="/api/logout">
          <Button type="submit" variant="ghost" size="sm" isIconOnly aria-label="Salir">
            <Icon icon={ArrowRightFromSquare} />
          </Button>
        </form>
        <SidebarLabel collapsed={collapsed}>
          <Text tone="muted">Salir</Text>
        </SidebarLabel>
      </div>

      <button
        type="button"
        aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        onClick={() => setCollapsed((v) => !v)}
        className="absolute top-20 -right-3 flex size-6 items-center justify-center rounded-full border border-separator bg-surface text-muted shadow-sm transition-colors hover:text-foreground"
      >
        {collapsed ? <Icon icon={ChevronsRight} size="sm" /> : <Icon icon={ChevronsLeft} size="sm" />}
      </button>
    </nav>
  );
}

function iconProps() {
  return { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
}
function HomeIcon() {
  return <svg {...iconProps()}><path d="M3 11l9-7 9 7" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></svg>;
}
function WalletIcon() {
  return <svg {...iconProps()}><rect x="2.5" y="6" width="19" height="13" rx="2" /><path d="M2.5 10h19" /><path d="M16.5 14h2.5" /></svg>;
}
function ListIcon() {
  return <svg {...iconProps()}><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" /></svg>;
}
function PieIcon() {
  return <svg {...iconProps()}><path d="M12 2a10 10 0 1 0 10 10H12V2z" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>;
}
function RepeatIcon() {
  return <svg {...iconProps()}><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>;
}
function FlagIcon() {
  return <svg {...iconProps()}><path d="M5 21V4" /><path d="M5 4h13l-3 4 3 4H5" /></svg>;
}
function GearIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.36 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
    </svg>
  );
}
