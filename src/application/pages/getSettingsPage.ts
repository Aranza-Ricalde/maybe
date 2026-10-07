import type { AuthenticatedUser } from "@/domain/auth/ports";
import { resolveCategoryDescription } from "@/domain/categories/descriptions";
import { orderCategoriesAsTree } from "@/domain/categories/rules";
import { groupPeriodsByMonth, monthKeyOf, monthName, normalizePeriodView } from "@/domain/payPeriod/periodView";
import type { PeriodViewRepository } from "@/domain/payPeriod/ports";
import { findPeriodIndexContaining, nextPeriodDefaults, rangeFromPeriods } from "@/domain/payPeriod/rules";
import type { CategoriesReader, ProfileReader } from "@/domain/readModels/ports";
import type { TelegramLinkCodes } from "@/domain/telegram/ports";
import type { DescribeApiTokenUseCase } from "../apiToken";
import type { ListPayPeriodsUseCase } from "../listPayPeriods";

export class GetSettingsPageUseCase {
  constructor(
    private readonly categories: CategoriesReader,
    private readonly profiles: ProfileReader,
    private readonly periods: ListPayPeriodsUseCase,
    private readonly linkCodes: TelegramLinkCodes,
    private readonly apiToken: DescribeApiTokenUseCase,
    private readonly views: PeriodViewRepository,
  ) {}

  async execute(user: AuthenticatedUser, today: string) {
    const [categories, profile, periods, apiToken, storedView] = await Promise.all([this.categories.list(user.familyId), this.profiles.profile(user.id), this.periods.execute(user.familyId, today), this.apiToken.execute(user.familyId), this.views.get(user.familyId)]);

    const currentIndex = findPeriodIndexContaining(periods, today);
    const nextPeriod = nextPeriodDefaults(periods.at(-1)?.end ?? null, today);
    const currentMonthKey = periods[currentIndex] ? monthKeyOf(periods[currentIndex]) : null;

    return {
      userName: user.name,
      userEmail: profile?.email,
      isTelegramLinked: Boolean(profile?.telegramChatId),
      telegramLinkCode: this.linkCodes.codeFor(user.id),
      apiToken: apiToken ? { lastFour: apiToken.lastFour, createdAt: apiToken.createdAt.toISOString(), lastUsedAt: apiToken.lastUsedAt?.toISOString() ?? null } : null,
      categories: orderCategoriesAsTree(categories).map((category) => {
        const description = resolveCategoryDescription(category.name, category.description);
        return { ...category, nature: category.spendingNature ?? null, description: category.description ?? null, descriptionText: description.text, descriptionIsSuggested: description.isSuggested };
      }),
      periods: periods.map((period, index) => ({ id: period.id, index: index + 1, start: period.start, end: period.end, isCurrent: index === currentIndex })),
      periodView: normalizePeriodView(storedView),
      months: groupPeriodsByMonth(periods).map((month) => {
        const range = rangeFromPeriods(month.periods);
        return { id: month.periods[0].id, name: monthName(month.key), start: range.start, end: range.end, periodCount: month.periods.length, isCurrent: month.key === currentMonthKey };
      }),
      nextPeriodDefaultStart: nextPeriod.start,
      nextPeriodDefaultEnd: nextPeriod.end,
    };
  }
}
