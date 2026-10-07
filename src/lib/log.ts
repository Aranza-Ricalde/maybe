export function logFailure(context: string, error: unknown): void {
  console.error(context, error instanceof Error ? error.message : "error desconocido");
}

export function logInfo(context: string, metadata: Record<string, string | number | boolean | null>): void {
  console.info(context, JSON.stringify(metadata));
}
