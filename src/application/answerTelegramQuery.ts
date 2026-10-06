import { isLiabilityAccountType } from "@/domain/accounts/rules";
import type { FlowReader } from "@/domain/dashboard/ports";
import type { AccountsReader, CategoriesReader, TransactionsReader } from "@/domain/readModels/ports";
import { normalizeAccountName } from "@/domain/captures/rules";
import { balancesText, recentText, summaryText } from "@/domain/telegram/messages";
import { periodLabel } from "@/domain/payPeriod/rules";
import type { ResolvePeriodContextUseCase } from "./pages/resolvePeriodContext";

const TOP_CATEGORIES = 3;

export class AnswerTelegramQueryUseCase {
  constructor(
    private readonly accounts: AccountsReader,
    private readonly transactions: TransactionsReader,
    private readonly categories: CategoriesReader,
    private readonly periods: ResolvePeriodContextUseCase,
    private readonly flow: FlowReader,
  ) {}

  async balances(familyId: number, today: string, accountFilter: string): Promise<string> {
    const wanted = normalizeAccountName(accountFilter);
    const active = (await this.accounts.listActive(familyId)).filter((account) => !wanted || normalizeAccountName(account.name).includes(wanted));
    if (active.length === 0) return accountFilter ? `No encontré una cuenta que coincida con "${accountFilter}".` : balancesText([]);
    const balances = await this.accounts.balancesAsOf(active.map((account) => account.id), today);
    return balancesText(active.map((account) => ({ name: account.name, balanceCents: balances.get(account.id) ?? 0, isLiability: isLiabilityAccountType(account.type) })));
  }

  async recent(familyId: number, limit: number): Promise<string> {
    return recentText(await this.transactions.recent(familyId, limit));
  }

  async summary(familyId: number, today: string): Promise<string> {
    const { displayPeriod } = await this.periods.execute(familyId, today, undefined);
    const [flow, totals, categories] = await Promise.all([
      this.flow.getFlowForDateRange(familyId, displayPeriod.start, displayPeriod.end),
      this.categories.expenseTotalsBetween(familyId, displayPeriod.start, displayPeriod.end),
      this.categories.list(familyId),
    ]);
    const names = new Map(categories.map((category) => [category.id, category.name]));
    const topCategories = totals
      .map((total) => ({ name: names.get(total.categoryId) ?? "Sin categoría", totalCents: Math.abs(total.totalCents) }))
      .sort((a, b) => b.totalCents - a.totalCents)
      .slice(0, TOP_CATEGORIES);
    return summaryText({ label: periodLabel(displayPeriod.start, displayPeriod.end), incomeCents: Math.abs(flow.incomeCents), expenseCents: Math.abs(flow.expenseCents), topCategories });
  }
}
