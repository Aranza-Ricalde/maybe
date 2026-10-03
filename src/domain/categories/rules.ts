import { FLOWS, type Flow } from "@/domain/ledger/rules";

export class InvalidCategoryError extends Error {}

export function assertValidCategoryName(name: string): void {
  if (!name.trim()) {
    throw new InvalidCategoryError("El nombre de la categoría no puede estar vacío.");
  }
}

export function assertValidCategoryClassification(classification: string): asserts classification is Flow {
  if (!FLOWS.includes(classification as Flow)) {
    throw new InvalidCategoryError(`Clasificación de categoría inválida: "${classification}".`);
  }
}

export const DEFAULT_CATEGORY_ICON = "tag";
