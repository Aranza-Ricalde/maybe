"use client";

import { useCallback, useSyncExternalStore } from "react";
import { ACCENT_CHANGE_EVENT, ACCENT_COOKIE, DEFAULT_ACCENT, normalizeAccent, type Accent } from "@/lib/accent";
import { readCookieValue, themeCookie } from "@/lib/theme";

function readAccent(): Accent {
  return normalizeAccent(readCookieValue(document.cookie, ACCENT_COOKIE));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(ACCENT_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(ACCENT_CHANGE_EVENT, onChange);
}

export function useAccentPreference(): { accent: Accent; setAccent: (next: Accent) => void } {
  const accent = useSyncExternalStore(subscribe, readAccent, () => DEFAULT_ACCENT);

  const setAccent = useCallback((next: Accent) => {
    document.cookie = themeCookie(ACCENT_COOKIE, next);
    document.documentElement.setAttribute("data-accent", next);
    window.dispatchEvent(new Event(ACCENT_CHANGE_EVENT));
  }, []);

  return { accent, setAccent };
}
