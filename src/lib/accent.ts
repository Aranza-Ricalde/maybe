export const ACCENTS = ["neutral", "teal", "blue", "violet", "rose", "orange", "green"] as const;
export type Accent = (typeof ACCENTS)[number];

export const DEFAULT_ACCENT: Accent = "teal";
export const ACCENT_COOKIE = "maybe-accent";
export const ACCENT_CHANGE_EVENT = "maybe-accent-change";

export const ACCENT_LABELS: Record<Accent, string> = {
  neutral: "Negro",
  teal: "Verde azulado",
  blue: "Azul",
  violet: "Violeta",
  rose: "Rosa",
  orange: "Naranja",
  green: "Verde",
};

export const ACCENT_SWATCHES: Record<Accent, string> = {
  neutral: "#171717",
  teal: "#0f6f63",
  blue: "#2563eb",
  violet: "#7c3aed",
  rose: "#e11d48",
  orange: "#ea580c",
  green: "#16a34a",
};

export function normalizeAccent(raw: string | null | undefined): Accent {
  return ACCENTS.includes(raw as Accent) ? (raw as Accent) : DEFAULT_ACCENT;
}
