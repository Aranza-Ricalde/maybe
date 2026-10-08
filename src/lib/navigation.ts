import { ROUTES } from "@/domain/shared/routes";

export function isNavActive(pathname: string, href: string): boolean {
  if (href === ROUTES.dashboard) return pathname === ROUTES.dashboard;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface NavLike {
  href: string;
  inBottomBar: boolean;
}

export type WithActive<T> = T & { active: boolean };

export function partitionNav<T extends NavLike>(items: T[], pathname: string): { bar: WithActive<T>[]; more: WithActive<T>[]; moreActive: boolean } {
  const withActive = items.map((item) => ({ ...item, active: isNavActive(pathname, item.href) }));
  const more = withActive.filter((item) => !item.inBottomBar);
  return { bar: withActive.filter((item) => item.inBottomBar), more, moreActive: more.some((item) => item.active) };
}
