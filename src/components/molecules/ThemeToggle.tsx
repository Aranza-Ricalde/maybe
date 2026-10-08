"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemePreference } from "@/hooks/useThemePreference";
import { THEME_LABELS, THEME_PREFERENCES, type ThemePreference } from "@/lib/theme";

const ICON = { system: Monitor, light: Sun, dark: Moon } as const;

const nextPreference = (current: ThemePreference): ThemePreference => THEME_PREFERENCES[(THEME_PREFERENCES.indexOf(current) + 1) % THEME_PREFERENCES.length];

export function ThemeToggle() {
  const { preference, setPreference } = useThemePreference();
  const Icon = ICON[preference];

  return (
    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Tema: ${THEME_LABELS[preference]}. Cambiar`} onClick={() => setPreference(nextPreference(preference))}>
      <Icon />
    </Button>
  );
}
