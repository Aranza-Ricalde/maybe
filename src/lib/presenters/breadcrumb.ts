export interface TitledRoute {
  href: string;
  label: string;
}

export function pageTitleFor(pathname: string, routes: TitledRoute[]): string {
  const matches = routes.filter((route) => (route.href === "/" ? pathname === "/" : pathname === route.href || pathname.startsWith(`${route.href}/`)));
  return matches.sort((a, b) => b.href.length - a.href.length)[0]?.label ?? "";
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts.length === 1 ? parts[0].slice(0, 2) : `${parts[0][0]}${parts[1][0]}`).toUpperCase();
}
