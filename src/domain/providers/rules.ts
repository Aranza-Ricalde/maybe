export function normalizeProviderName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}
