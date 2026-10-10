import { CaptureAccountAmbiguousError, CaptureAccountNotFoundError, normalizeAccountName } from "@/domain/captures/rules";
import type { NotificationChannel, NotificationsRepository } from "@/domain/notifications/ports";
import type { PlannedNotification } from "@/domain/notifications/rules";
import type { AccountsReader } from "@/domain/readModels/ports";
import { InvalidInboxStatementError, assertInboxFile, isStatementBank, type StatementInboxRepository } from "@/domain/statements/inbox";
import { STATEMENT_BANK_LABELS } from "@/domain/statements/types";

export interface ReceiveStatementInput {
  familyId: number;
  bank: string;
  accountName: string;
  filename: string;
  data: Uint8Array;
  fromAddress: string | null;
  subject: string | null;
  receivedAt: string | null;
}

export type ReceiveStatementResult = { status: "received"; id: number; accountName: string } | { status: "duplicate" };

export class ReceiveStatementUseCase {
  constructor(
    private readonly accounts: Pick<AccountsReader, "listActive">,
    private readonly inbox: StatementInboxRepository,
    private readonly notifications: Pick<NotificationsRepository, "insertIfNew" | "markSent">,
    private readonly channel: NotificationChannel,
  ) {}

  async execute(input: ReceiveStatementInput): Promise<ReceiveStatementResult> {
    if (!isStatementBank(input.bank)) throw new InvalidInboxStatementError("El banco no es válido.");
    assertInboxFile(input.data);

    const account = await this.resolveAccount(input.familyId, input.accountName);
    const id = await this.inbox.insertIfNew(input.familyId, {
      bank: input.bank,
      accountId: account.id,
      filename: input.filename,
      data: input.data,
      fromAddress: input.fromAddress,
      subject: input.subject,
      receivedAt: input.receivedAt,
    });
    if (id === null) return { status: "duplicate" };

    await this.announce(input.familyId, id, STATEMENT_BANK_LABELS[input.bank], input.filename);
    return { status: "received", id, accountName: account.name };
  }

  private async resolveAccount(familyId: number, name: string) {
    const wanted = normalizeAccountName(name);
    const matches = (await this.accounts.listActive(familyId)).filter((account) => normalizeAccountName(account.name) === wanted);
    if (matches.length === 0) throw new CaptureAccountNotFoundError(`No encontré la cuenta "${name}".`);
    if (matches.length > 1) throw new CaptureAccountAmbiguousError(`Hay más de una cuenta llamada "${name}".`);
    return matches[0];
  }

  private async announce(familyId: number, inboxId: number, bankLabel: string, filename: string): Promise<void> {
    const notification: PlannedNotification = {
      kind: "statement_ready",
      dedupeKey: `statement:${inboxId}`,
      title: "Tu estado de cuenta ya está disponible",
      body: `${bankLabel}: ${filename} está listo para revisar e importar.`,
      href: "/import",
      payload: { inboxId },
    };
    const notificationId = await this.notifications.insertIfNew(familyId, notification);
    if (notificationId === null) return;
    try {
      await this.channel.deliver(familyId, notification);
      await this.notifications.markSent(notificationId);
    } catch {
      return;
    }
  }
}
