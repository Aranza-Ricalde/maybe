"use client";

import { useCallback, useState } from "react";
import type { PendingInboxStatement } from "@/domain/statements/inbox";
import { useStatementImport } from "@/providers/StatementImportProvider";

export function useInboxStatements() {
  const { items, addFiles } = useStatementImport();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const review = useCallback(
    async (statement: PendingInboxStatement) => {
      setLoadingId(statement.id);
      setError(null);
      try {
        const response = await fetch(`/api/statements/inbox/${statement.id}/file`);
        if (!response.ok) throw new Error("No se pudo descargar el estado.");
        const blob = await response.blob();
        addFiles([new File([blob], statement.filename, { type: "application/pdf" })], { bank: statement.bank, accountId: statement.accountId, inboxId: statement.id });
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "No se pudo abrir el estado.");
      } finally {
        setLoadingId(null);
      }
    },
    [addFiles],
  );

  const inQueue = new Set(items.flatMap((item) => (item.inboxId == null ? [] : [item.inboxId])));

  return { inQueue, loadingId, error, review };
}
