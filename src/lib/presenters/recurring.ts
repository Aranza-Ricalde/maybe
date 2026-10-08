export function recurringDetailLabel(accountName: string | undefined, categoryName: string | undefined): string {
  const parts = [accountName, categoryName].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : "Sin cuenta ni categoría";
}
