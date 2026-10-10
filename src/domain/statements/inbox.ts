import { STATEMENT_BANKS, type StatementBank } from "./types";

export const MAX_INBOX_STATEMENT_BYTES = 4 * 1024 * 1024;
export const RESOLVED_FILE_RETENTION_DAYS = 7;
const PDF_MAGIC = "%PDF-";

export class InvalidInboxStatementError extends Error {}
export class InboxAccountNotFoundError extends InvalidInboxStatementError {}
export class InboxAccountAmbiguousError extends InvalidInboxStatementError {}

export interface InboxStatementInput {
  bank: StatementBank;
  accountId: number;
  filename: string;
  data: Uint8Array;
  fromAddress: string | null;
  subject: string | null;
  receivedAt: string | null;
}

export interface PendingInboxStatement {
  id: number;
  bank: StatementBank;
  accountId: number;
  filename: string;
  sizeBytes: number;
  fromAddress: string | null;
  subject: string | null;
  receivedAt: string;
}

export interface InboxFile {
  filename: string;
  data: Uint8Array;
}

export interface StatementInboxRepository {
  insertIfNew(familyId: number, input: InboxStatementInput): Promise<number | null>;
  listPending(familyId: number): Promise<PendingInboxStatement[]>;
  getFile(familyId: number, id: number): Promise<InboxFile | null>;
  dismiss(familyId: number, id: number): Promise<void>;
  markImportedByContent(familyId: number, data: Uint8Array, importId: number): Promise<void>;
  restoreByImport(familyId: number, importId: number): Promise<void>;
  purgeResolvedFiles(resolvedBefore: Date): Promise<number>;
}

export function isStatementBank(value: string): value is StatementBank {
  return (STATEMENT_BANKS as readonly string[]).includes(value);
}

export function looksLikePdf(data: Uint8Array): boolean {
  if (data.length < PDF_MAGIC.length) return false;
  return PDF_MAGIC.split("").every((char, index) => data[index] === char.charCodeAt(0));
}

export function assertInboxFile(data: Uint8Array): void {
  if (data.length === 0 || !looksLikePdf(data)) throw new InvalidInboxStatementError("El archivo no es un PDF válido.");
  if (data.length > MAX_INBOX_STATEMENT_BYTES) throw new InvalidInboxStatementError("El PDF pesa más de 4 MB.");
}
