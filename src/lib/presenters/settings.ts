export const SETTINGS_SECTIONS = [
  { id: "cuenta", label: "Cuenta" },
  { id: "apariencia", label: "Apariencia" },
  { id: "notificaciones", label: "Notificaciones" },
  { id: "integraciones", label: "Integraciones" },
  { id: "categorias", label: "Categorías" },
  { id: "periodos", label: "Periodos" },
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]["id"];
export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = "cuenta";
export const SETTINGS_SECTION_PARAM = "s";

export function parseSettingsSection(value: string | string[] | undefined): SettingsSectionId {
  const raw = Array.isArray(value) ? value[0] : value;
  return SETTINGS_SECTIONS.some((section) => section.id === raw) ? (raw as SettingsSectionId) : DEFAULT_SETTINGS_SECTION;
}

export function settingsSectionHref(pathname: string, section: SettingsSectionId): string {
  return section === DEFAULT_SETTINGS_SECTION ? pathname : `${pathname}?${SETTINGS_SECTION_PARAM}=${section}`;
}
