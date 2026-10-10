import { addDays } from "@/domain/payPeriod/rules";
import { RESOLVED_FILE_RETENTION_DAYS, type StatementInboxRepository } from "@/domain/statements/inbox";

export class PurgeStatementInboxUseCase {
  constructor(private readonly inbox: Pick<StatementInboxRepository, "purgeResolvedFiles">) {}

  async execute(today: string): Promise<number> {
    const cutoff = new Date(`${addDays(today, -RESOLVED_FILE_RETENTION_DAYS)}T00:00:00Z`);
    return this.inbox.purgeResolvedFiles(cutoff);
  }
}
