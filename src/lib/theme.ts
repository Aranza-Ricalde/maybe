export const THEME_PREFERENCES = ["system", "light", "dark"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = "light" | "dark";

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";
export const THEME_COOKIE = "maybe-theme";
export const RESOLVED_THEME_COOKIE = "maybe-theme-resolved";
export const THEME_CHANGE_EVENT = "maybe-theme-change";
export const DARK_QUERY = "(prefers-color-scheme: dark)";

const ONE_YEAR_SECONDS = 31_536_000;

export const THEME_LABELS: Record<ThemePreference, string> = { system: "Sistema", light: "Claro", dark: "Oscuro" };

export function normalizeThemePreference(raw: string | null | undefined): ThemePreference {
  return THEME_PREFERENCES.includes(raw as ThemePreference) ? (raw as ThemePreference) : DEFAULT_THEME_PREFERENCE;
}

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === "system") return systemPrefersDark ? "dark" : "light";
  return preference;
}

export function initialThemeAttribute(preferenceRaw: string | null | undefined, resolvedRaw: string | null | undefined): ResolvedTheme {
  const preference = normalizeThemePreference(preferenceRaw);
  if (preference !== "system") return preference;
  return resolvedRaw === "dark" ? "dark" : "light";
}

export function themeCookie(name: string, value: string): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

export function readCookieValue(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}
