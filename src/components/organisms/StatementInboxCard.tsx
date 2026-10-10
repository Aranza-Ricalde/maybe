"use client";

import { Inbox } from "lucide-react";
import { useState } from "react";
import { ActionForm } from "@/components/molecules/ActionForm";
import { PendingSubmitButton } from "@/components/molecules/PendingSubmitButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PendingInboxStatement } from "@/domain/statements/inbox";
import { useInboxStatements } from "@/hooks/useInboxStatements";
import type { FormAction } from "@/lib/actionResult";
import { FIELD } from "@/lib/formFields";
import { inboxStatementView } from "@/lib/presenters/statementInbox";

export interface StatementInboxCardProps {
  statements: Array<PendingInboxStatement & { accountName: string }>;
  dismissAction: FormAction;
}

export function StatementInboxCard({ statements, dismissAction }: StatementInboxCardProps) {
  const { inQueue, loadingId, error, review } = useInboxStatements();
  const [now] = useState(() => new Date());
  const visible = statements.filter((statement) => !inQueue.has(statement.id));
  if (visible.length === 0) return null;

  return (
    <Card aria-label="Estados pendientes de importar">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Inbox className="size-4 text-primary" aria-hidden />
          Pendientes de importar
          <span className="rounded-full bg-foreground px-2 text-xs font-medium text-background tabular-nums">{visible.length}</span>
        </CardTitle>
        <CardDescription className="max-md:hidden">Estados que llegaron a tu correo. El PDF se conserva solo hasta que lo importes o descartes (y 7 días más por si deshaces).</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <p role="alert" className="mb-3 text-sm text-danger">
            {error}
          </p>
        )}
        <ul className="flex flex-col divide-y">
          {visible.map((statement) => {
            const view = inboxStatementView(statement, now);
            return (
              <li key={statement.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{view.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{view.filename}</p>
                  <p className="text-xs text-muted-foreground">{view.meta}</p>
                </div>
                <div className="flex items-center gap-2 max-md:w-full">
                  <Button type="button" size="sm" disabled={loadingId === statement.id} onClick={() => review(statement)} className="max-md:flex-1">
                    Revisar
                  </Button>
                  <ActionForm action={dismissAction}>
                    <input type="hidden" name={FIELD.id} value={statement.id} />
                    <PendingSubmitButton variant="ghost">Descartar</PendingSubmitButton>
                  </ActionForm>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
