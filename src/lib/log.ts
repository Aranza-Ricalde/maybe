export function logFailure(context: string, error: unknown): void {
  console.error(context, error instanceof Error ? error.message : "error desconocido");
}
