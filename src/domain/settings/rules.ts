
export const DEFAULT_MINIMUM_BALANCE_CENTS = 0;
export const MAX_MINIMUM_BALANCE_CENTS = 1_000_000_000_00;

export class InvalidSettingError extends Error {}

export function assertValidMinimumBalance(cents: number | null): void {
  if (cents == null) return;
  if (!Number.isInteger(cents) || cents < 0 || cents > MAX_MINIMUM_BALANCE_CENTS) {
    throw new InvalidSettingError("El saldo mínimo debe ser un monto en pesos de cero en adelante.");
  }
}

export function effectiveMinimumBalance(stored: number | null): number {
  return stored ?? DEFAULT_MINIMUM_BALANCE_CENTS;
}
