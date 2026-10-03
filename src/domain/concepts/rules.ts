export class InvalidConceptError extends Error {}

export function assertValidConceptName(name: string): void {
  if (!name.trim()) {
    throw new InvalidConceptError("El nombre del concepto no puede estar vacío.");
  }
}
