"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from "@/components/ui/sidebar";
import { isNavActive } from "@/lib/navigation";
import { NavUser, type NavUserProps } from "./NavUser";
import { NAV_GROUPS } from "./navItems";

export function AppSidebar({ user }: { user: NavUserProps }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">M</span>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Maybe</span>
                <span className="truncate text-xs text-muted-foreground">Finanzas personales</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Navegación principal">
          {NAV_GROUPS.map((group) => (
            <SidebarGroup key={group.label}>
              {group.items.length > 1 || group.label !== group.items[0]?.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isNavActive(pathname, item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton isActive={active} tooltip={item.label} render={<Link href={item.href} aria-current={active ? "page" : undefined} />}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <NavUser {...user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
