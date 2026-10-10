import type { PendingInboxStatement } from "@/domain/statements/inbox";
import { STATEMENT_BANK_LABELS } from "@/domain/statements/types";
import { notificationAge } from "./notifications";

export interface InboxStatementView {
  id: number;
  title: string;
  filename: string;
  meta: string;
}

export function inboxStatementView(statement: PendingInboxStatement & { accountName: string }, now: Date): InboxStatementView {
  return {
    id: statement.id,
    title: STATEMENT_BANK_LABELS[statement.bank],
    filename: statement.filename,
    meta: `${statement.accountName} · ${notificationAge(statement.receivedAt, now).toLowerCase()}`,
  };
}
