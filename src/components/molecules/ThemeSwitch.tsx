"use client";

import { SegmentedButtons } from "@/components/molecules/SegmentedButtons";
import { useThemePreference } from "@/hooks/useThemePreference";
import { THEME_LABELS, THEME_PREFERENCES } from "@/lib/theme";

export function ThemeSwitch() {
  const { preference, setPreference } = useThemePreference();
  return <SegmentedButtons options={THEME_PREFERENCES.map((value) => ({ value, label: THEME_LABELS[value] }))} value={preference} onChange={setPreference} />;
}
