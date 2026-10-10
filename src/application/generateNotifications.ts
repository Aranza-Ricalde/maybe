import type { AuthenticatedUser } from "@/domain/auth/ports";
import type { FamilyDirectory, NotificationChannel, NotificationsRepository } from "@/domain/notifications/ports";
import { planNotifications, retentionCutoff, type BudgetLineInput } from "@/domain/notifications/rules";
import type { GetBudgetsPageUseCase } from "./pages/getBudgetsPage";
import type { GetDashboardPageUseCase } from "./pages/getDashboardPage";

export interface GenerateNotificationsResult {
  families: number;
  created: number;
  failed: number;
  purged: number;
}

export class GenerateNotificationsUseCase {
  constructor(
    private readonly directory: FamilyDirectory,
    private readonly dashboard: Pick<GetDashboardPageUseCase, "execute">,
    private readonly budgets: Pick<GetBudgetsPageUseCase, "execute">,
    private readonly repository: NotificationsRepository,
    private readonly channel: NotificationChannel,
  ) {}

  async execute(today: string): Promise<GenerateNotificationsResult> {
    const users = await this.directory.listFamilyUsers();
    const result: GenerateNotificationsResult = { families: 0, created: 0, failed: 0, purged: 0 };
    const seen = new Set<number>();

    for (const user of users) {
      if (seen.has(user.familyId)) continue;
      seen.add(user.familyId);
      result.families += 1;
      try {
        result.created += await this.forFamily(user, today);
      } catch {
        result.failed += 1;
      }
    }

    result.purged = await this.repository.purgeOlderThan(retentionCutoff(today));
    return result;
  }

  private async forFamily(user: AuthenticatedUser, today: string): Promise<number> {
    const familyId = user.familyId;
    const [dashboard, budgets, lastCash, lastPending] = await Promise.all([
      this.dashboard.execute(user, today, undefined),
      this.budgets.execute(familyId, today, undefined),
      this.repository.lastOfKind(familyId, "cash_negative"),
      this.repository.lastOfKind(familyId, "pending_decisions"),
    ]);

    const availableCents = dashboard.summary.availableToSpend.availableCents;
    if (availableCents >= 0) await this.repository.resolveOpen(familyId, "cash_negative");

    const budgetLines: BudgetLineInput[] = budgets.rows
      .filter((row) => row.depth === 0)
      .map((row) => ({ categoryId: row.categoryId, name: row.name, budgetCents: row.effectiveBudgetedCents, spentCents: row.actualCents, isSavings: row.isSavings }));

    const planned = planNotifications({
      today,
      periodStart: dashboard.periodRange.from,
      entries: dashboard.calendarEntries,
      budgetLines,
      availableCents,
      pendingDecisions: dashboard.pendingCandidates.length + dashboard.pendingConceptSuggestions.length,
      lastCash,
      lastPending,
    });

    let created = 0;
    for (const notification of planned) {
      const id = await this.repository.insertIfNew(familyId, notification);
      if (id === null) continue;
      created += 1;
      try {
        await this.channel.deliver(familyId, notification);
        await this.repository.markSent(id);
      } catch {
        continue;
      }
    }
    return created;
  }
}
