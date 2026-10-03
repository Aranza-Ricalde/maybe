export class InvalidCredentialsInputError extends Error {}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 10;
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export function assertValidEmail(email: string): void {
  if (!EMAIL_PATTERN.test(email)) {
    throw new InvalidCredentialsInputError(`email inválido: "${email}"`);
  }
}

export function assertValidPassword(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new InvalidCredentialsInputError(`la contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
  }
}

export function refreshTokenExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);
}

export function isExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
