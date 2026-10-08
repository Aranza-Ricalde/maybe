import { CircleCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ConfirmSummary } from "@/lib/statementQueue";

export function ImportResultAlert({ fileName, result }: { fileName: string; result: ConfirmSummary | null }) {
  return (
    <Alert variant="success">
      <CircleCheck />
      <AlertTitle>{fileName}</AlertTitle>
      <AlertDescription>
        {result?.imported ?? 0} importados, {result?.linked ?? 0} vinculados, {result?.skipped ?? 0} omitidos
        {result && result.paired > 0 ? `, ${result.paired} emparejados` : ""}.
      </AlertDescription>
    </Alert>
  );
}
