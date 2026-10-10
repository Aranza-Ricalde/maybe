import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ConfirmSummary } from "@/lib/statementQueue";

export function ImportResultAlert({ fileName, result, onUndo, onDismiss }: { fileName: string; result: ConfirmSummary | null; onUndo: () => void; onDismiss: () => void }) {
  return (
    <Alert variant="success">
      <CircleCheck />
      <AlertTitle>{fileName}</AlertTitle>
      <AlertDescription>
        {result?.imported ?? 0} importados, {result?.linked ?? 0} vinculados, {result?.skipped ?? 0} omitidos
        {result && result.paired > 0 ? `, ${result.paired} emparejados` : ""}.
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {result?.importId != null && (
            <Button type="button" size="sm" variant="outline" onClick={onUndo}>
              Deshacer importación
            </Button>
          )}
          <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
            Listo
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
