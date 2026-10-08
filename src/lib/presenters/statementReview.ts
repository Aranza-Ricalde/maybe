import type { PreviewRow } from "@/domain/statements/reconcile";
import type { StatementPreview } from "@/domain/statements/reconcile";

export type ReviewTab = "new" | "probable" | "imported" | "orphans";

export const REVIEW_TAB_HELP: Record<ReviewTab, string> = {
  new: "Movimientos del PDF que todavía no tienes en la app. Los marcados se van a crear.",
  probable: "Estos movimientos del PDF se parecen a algo que ya registraste (mismo monto y fecha cercana). Por defecto se omiten para no duplicar. Vincular marca el tuyo como conciliado sin cambiar su categoría, notas ni nombre.",
  imported: "Ya se importaron desde un estado anterior. No se vuelven a importar.",
  orphans: "Solo informativo: movimientos tuyos de este periodo que el PDF no respalda. Revísalos por si hay un error de captura.",
};

export function reviewTabs(preview: StatementPreview): Array<{ value: ReviewTab; label: string }> {
  return [
    { value: "new", label: `Nuevos (${preview.counts.new})` },
    { value: "probable", label: `Ya los tengo (${preview.counts.probableMatch})` },
    { value: "imported", label: `Ya importados (${preview.counts.alreadyImported})` },
    { value: "orphans", label: `Solo en mi app (${preview.unmatchedExisting.length})` },
  ];
}

export function rowsForTab(preview: StatementPreview, tab: ReviewTab): PreviewRow[] {
  const status = tab === "new" ? "new" : tab === "probable" ? "probable_match" : "already_imported";
  return preview.rows.filter((row) => row.status === status);
}
