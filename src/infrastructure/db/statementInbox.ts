import { createHash } from "node:crypto";
import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import type { InboxFile, InboxStatementInput, PendingInboxStatement, StatementInboxRepository } from "@/domain/statements/inbox";
import type { StatementBank } from "@/domain/statements/types";
import { db } from "./client";
import { statementInbox } from "./schema/imports";

const PENDING = "pending";
const IMPORTED = "imported";
const DISMISSED = "dismissed";

const hasFile = sql`octet_length(${statementInbox.data}) > 0`;

const sha256 = (data: Uint8Array) => createHash("sha256").update(data).digest("hex");

export class DrizzleStatementInbox implements StatementInboxRepository {
  async insertIfNew(familyId: number, input: InboxStatementInput): Promise<number | null> {
    const [row] = await db
      .insert(statementInbox)
      .values({
        familyId,
        bank: input.bank,
        accountId: input.accountId,
        filename: input.filename,
        contentHash: sha256(input.data),
        sizeBytes: input.data.length,
        data: Buffer.from(input.data),
        fromAddress: input.fromAddress,
        subject: input.subject,
        ...(input.receivedAt ? { receivedAt: new Date(input.receivedAt) } : {}),
      })
      .onConflictDoNothing()
      .returning({ id: statementInbox.id });
    return row?.id ?? null;
  }

  async listPending(familyId: number): Promise<PendingInboxStatement[]> {
    const rows = await db
      .select({
        id: statementInbox.id,
        bank: statementInbox.bank,
        accountId: statementInbox.accountId,
        filename: statementInbox.filename,
        sizeBytes: statementInbox.sizeBytes,
        fromAddress: statementInbox.fromAddress,
        subject: statementInbox.subject,
        receivedAt: statementInbox.receivedAt,
      })
      .from(statementInbox)
      .where(and(eq(statementInbox.familyId, familyId), eq(statementInbox.status, PENDING)))
      .orderBy(desc(statementInbox.receivedAt));
    return rows.map((row) => ({ ...row, bank: row.bank as StatementBank, receivedAt: row.receivedAt.toISOString() }));
  }

  async getFile(familyId: number, id: number): Promise<InboxFile | null> {
    const [row] = await db
      .select({ filename: statementInbox.filename, data: statementInbox.data })
      .from(statementInbox)
      .where(and(eq(statementInbox.familyId, familyId), eq(statementInbox.id, id), hasFile));
    return row ? { filename: row.filename, data: new Uint8Array(row.data) } : null;
  }

  async dismiss(familyId: number, id: number): Promise<void> {
    await db
      .update(statementInbox)
      .set({ status: DISMISSED, resolvedAt: new Date() })
      .where(and(eq(statementInbox.familyId, familyId), eq(statementInbox.id, id), eq(statementInbox.status, PENDING)));
  }

  async restoreByImport(familyId: number, importId: number): Promise<void> {
    await db
      .update(statementInbox)
      .set({ status: PENDING, resolvedAt: null, importId: null })
      .where(and(eq(statementInbox.familyId, familyId), eq(statementInbox.importId, importId), eq(statementInbox.status, IMPORTED), hasFile));
  }

  async purgeResolvedFiles(resolvedBefore: Date): Promise<number> {
    const purged = await db
      .update(statementInbox)
      .set({ data: Buffer.alloc(0), sizeBytes: 0 })
      .where(and(inArray(statementInbox.status, [IMPORTED, DISMISSED]), lt(statementInbox.resolvedAt, resolvedBefore), hasFile))
      .returning({ id: statementInbox.id });
    return purged.length;
  }

  async markImportedByContent(familyId: number, data: Uint8Array, importId: number): Promise<void> {
    await db
      .update(statementInbox)
      .set({ status: IMPORTED, resolvedAt: new Date(), importId })
      .where(and(eq(statementInbox.familyId, familyId), eq(statementInbox.contentHash, sha256(data)), eq(statementInbox.status, PENDING)));
  }
}
