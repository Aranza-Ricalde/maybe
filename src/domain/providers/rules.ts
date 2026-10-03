export class InvalidProviderError extends Error {}

export function normalizeProviderName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function assertValidProviderName(name: string): void {
  if (!normalizeProviderName(name)) {
    throw new InvalidProviderError("El nombre del proveedor no puede estar vacío.");
  }
}
