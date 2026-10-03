export class InvalidGoalError extends Error {}

export function assertValidGoalInput(name: string, targetAmountCents: number): void {
  if (!name.trim()) {
    throw new InvalidGoalError("El nombre de la meta no puede estar vacío.");
  }
  if (!Number.isFinite(targetAmountCents) || targetAmountCents <= 0) {
    throw new InvalidGoalError("El monto objetivo debe ser mayor a 0.");
  }
}
