export const SPENDING_NATURES = ["essential", "discretionary"] as const;
export type SpendingNature = (typeof SPENDING_NATURES)[number];

export const SPENDING_NATURE_LABELS: Record<SpendingNature, string> = {
  essential: "Esencial",
  discretionary: "Discrecional",
};

export const NO_NATURE_FORM_VALUE = "none";

export class InvalidSpendingNatureError extends Error {}

export function assertValidSpendingNature(nature: string | null | undefined): asserts nature is SpendingNature | null | undefined {
  if (nature != null && !SPENDING_NATURES.includes(nature as SpendingNature)) {
    throw new InvalidSpendingNatureError(`Naturaleza de gasto inválida: "${nature}".`);
  }
}

export function parseSpendingNatureFormValue(value: FormDataEntryValue | null): SpendingNature | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw === "" || raw === NO_NATURE_FORM_VALUE) return null;
  assertValidSpendingNature(raw);
  return raw as SpendingNature;
}

export interface NatureCategory {
  id: number;
  parentId: number | null;
  nature: SpendingNature | null;
}

export function effectiveNature(category: NatureCategory, byId: Map<number, NatureCategory>): SpendingNature | null {
  if (category.nature != null) return category.nature;
  return category.parentId != null ? (byId.get(category.parentId)?.nature ?? null) : null;
}

const key = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const RECOMMENDED_NATURE_BY_NAME: Record<string, SpendingNature> = {
  [key("Vivienda")]: "essential",
  [key("Servicios")]: "essential",
  [key("Salud")]: "essential",
  [key("Transporte")]: "essential",
  [key("Despensa")]: "essential",
  [key("Educación")]: "essential",
  [key("Seguros")]: "essential",
  [key("Deuda")]: "essential",
  [key("Préstamos y deudas")]: "essential",
  [key("Ocio")]: "discretionary",
  [key("Restaurantes")]: "discretionary",
  [key("Delivery")]: "discretionary",
  [key("Café y snacks")]: "discretionary",
  [key("Compras personales")]: "discretionary",
  [key("Gimnasio y bienestar")]: "discretionary",
};

export interface NatureDefaultsInput extends NatureCategory {
  name: string;
  classification: "income" | "expense";
}

export function planNatureDefaults(categories: NatureDefaultsInput[]): { id: number; name: string; nature: SpendingNature }[] {
  return categories
    .filter((c) => c.classification === "expense" && c.nature == null)
    .flatMap((c) => {
      const nature = RECOMMENDED_NATURE_BY_NAME[key(c.name)];
      return nature ? [{ id: c.id, name: c.name, nature }] : [];
    });
}
