import type { AuthenticatedUser } from "@/domain/auth/ports";
import { orderCategoriesAsTree } from "@/domain/categories/rules";
import { findPeriodIndexContaining, nextPeriodDefaults } from "@/domain/payPeriod/rules";
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
  ) {}

  async execute(user: AuthenticatedUser, today: string) {
    const [categories, profile, periods, apiToken] = await Promise.all([this.categories.list(user.familyId), this.profiles.profile(user.id), this.periods.execute(user.familyId, today), this.apiToken.execute(user.familyId)]);

    const currentIndex = findPeriodIndexContaining(periods, today);
    const nextPeriod = nextPeriodDefaults(periods.at(-1)?.end ?? null, today);

    return {
      userName: user.name,
      userEmail: profile?.email,
      isTelegramLinked: Boolean(profile?.telegramChatId),
      telegramLinkCode: this.linkCodes.codeFor(user.id),
      apiToken: apiToken ? { lastFour: apiToken.lastFour, createdAt: apiToken.createdAt.toISOString(), lastUsedAt: apiToken.lastUsedAt?.toISOString() ?? null } : null,
      categories: orderCategoriesAsTree(categories).map((category) => ({ ...category, nature: category.spendingNature ?? null })),
      periods: periods.map((period, index) => ({ id: period.id, index: index + 1, start: period.start, end: period.end, isCurrent: index === currentIndex })),
      nextPeriodDefaultStart: nextPeriod.start,
      nextPeriodDefaultEnd: nextPeriod.end,
    };
  }
}
