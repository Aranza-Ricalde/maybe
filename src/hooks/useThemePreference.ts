"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { DARK_QUERY, DEFAULT_THEME_PREFERENCE, RESOLVED_THEME_COOKIE, THEME_CHANGE_EVENT, THEME_COOKIE, normalizeThemePreference, readCookieValue, resolveTheme, themeCookie, type ThemePreference } from "@/lib/theme";

function readPreference(): ThemePreference {
  return normalizeThemePreference(readCookieValue(document.cookie, THEME_COOKIE));
}

function applyTheme(preference: ThemePreference): void {
  const resolved = resolveTheme(preference, window.matchMedia(DARK_QUERY).matches);
  document.documentElement.setAttribute("data-theme", resolved);
  document.cookie = themeCookie(RESOLVED_THEME_COOKIE, resolved);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}

export function useThemePreference(): { preference: ThemePreference; setPreference: (next: ThemePreference) => void } {
  const preference = useSyncExternalStore(subscribe, readPreference, () => DEFAULT_THEME_PREFERENCE);

  useEffect(() => {
    applyTheme(preference);
    if (preference !== "system") return;
    const media = window.matchMedia(DARK_QUERY);
    const onSystemChange = () => applyTheme("system");
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    document.cookie = themeCookie(THEME_COOKIE, next);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  return { preference, setPreference };
}
