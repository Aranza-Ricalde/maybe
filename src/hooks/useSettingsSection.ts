import { useCallback, useState } from "react";
import { settingsSectionHref, type SettingsSectionId } from "@/lib/presenters/settings";

export function useSettingsSection(initial: SettingsSectionId) {
  const [section, setSection] = useState<SettingsSectionId>(initial);
  const select = useCallback((next: SettingsSectionId) => {
    setSection(next);
    window.history.replaceState(null, "", settingsSectionHref(window.location.pathname, next));
  }, []);
  return { section, select };
}
