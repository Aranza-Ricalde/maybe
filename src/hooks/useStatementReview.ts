import { useState } from "react";
import { canConfirmImport, countHighConfidenceMatches, hasTotalsMismatch, summarizeChoices, type RowChoice } from "@/domain/statements/decisions";
import { reviewTabs, rowsForTab, type ReviewTab } from "@/lib/presenters/statementReview";
import type { QueueItem } from "@/lib/statementQueue";
import { useStatementImport } from "@/providers/StatementImportProvider";

export function useStatementReview(item: QueueItem) {
  const { dispatch, confirm } = useStatementImport();
  const [tab, setTab] = useState<ReviewTab>("new");
  const preview = item.preview;
  if (!preview) return null;

  const busy = item.status === "confirming";

  return {
    preview,
    tab,
    setTab,
    tabs: reviewTabs(preview),
    rows: rowsForTab(preview, tab),
    busy,
    summary: summarizeChoices(preview, item.choices),
    mismatch: hasTotalsMismatch(preview),
    highCount: countHighConfidenceMatches(preview),
    canConfirm: canConfirmImport(preview, item.choices, item.acknowledgeMismatch, busy),
    setChoices: (choices: RowChoice[]) => dispatch({ type: "setChoices", id: item.id, choices }),
    acknowledge: (value: boolean) => dispatch({ type: "acknowledge", id: item.id, value }),
    discard: () => dispatch({ type: "remove", id: item.id }),
    confirm: () => void confirm(item.id),
  };
}
