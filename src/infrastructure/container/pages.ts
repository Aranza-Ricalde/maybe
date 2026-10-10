import { GenerateNotificationsUseCase } from "@/application/generateNotifications";
import { NotificationInbox } from "@/application/notificationInbox";
import { DrizzleFamilyDirectory } from "../db/familyDirectory";
import type { NotificationChannel } from "@/domain/notifications/ports";
import { DrizzleNotificationsRepository } from "../db/notifications";
import { DrizzlePushSubscriptionsRepository } from "../db/pushSubscriptions";
import { loadVapidConfig, WebPushSender } from "../push/webPushSender";
import { CompositeNotificationChannel, WebPushNotificationChannel } from "../push/webPushChannel";
import { TelegramNotificationChannel } from "../telegram/notificationChannel";
import { GetImportPageUseCase } from "@/application/pages/getImportPage";
import { GetAccountsPageUseCase } from "@/application/pages/getAccountsPage";
import { GetBudgetsPageUseCase } from "@/application/pages/getBudgetsPage";
import { GetDashboardPageUseCase } from "@/application/pages/getDashboardPage";
import { GetGoalsPageUseCase } from "@/application/pages/getGoalsPage";
import { GetProjectionPageUseCase } from "@/application/pages/getProjectionPage";
import { GetRecurringPageUseCase } from "@/application/pages/getRecurringPage";
import { GetStatsUseCase } from "@/application/getStats";
import { GetStatsPageUseCase } from "@/application/pages/getStatsPage";
import { GetSpendingPageUseCase } from "@/application/pages/getSpendingPage";
import { GetSettingsPageUseCase } from "@/application/pages/getSettingsPage";
import { GetTransactionsPageUseCase } from "@/application/pages/getTransactionsPage";
import { drizzleFamilyOwnership } from "../db/authorization";
import { familySettingsRepo, getAccountsBalanceHistoryUseCase, getCalendarOccurrencesUseCase, getCashProjectionUseCase, getDashboardSummaryUseCase, getDebtCalendarUseCase, getDebtOverviewUseCase, getCategoryStatsUseCase, getEmergencyFundUseCase, getExplorerUseCase, getGoalProjectionsUseCase, getInsightsUseCase, getProjectionBaseUseCase, getSpendingAnalysisUseCase, getTransferSuggestionsUseCase, listPayPeriodsUseCase, resolvePeriodContextUseCase, telegramLinkCodes, telegramSender, uncategorizedTransactionsRepo } from "./core";
import { captureRepo, describeApiTokenUseCase } from "./captures";
import { accountsReader, categoriesReader, inboxReader, planningReader, profileReader, transactionsReader } from "./readers";



export const getAccountsPageUseCase = new GetAccountsPageUseCase(accountsReader, getAccountsBalanceHistoryUseCase, getDebtOverviewUseCase);
export const getBudgetsPageUseCase = new GetBudgetsPageUseCase(resolvePeriodContextUseCase, categoriesReader, planningReader);
export const getImportPageUseCase = new GetImportPageUseCase(accountsReader, categoriesReader);
export const getGoalsPageUseCase = new GetGoalsPageUseCase(planningReader, accountsReader, getGoalProjectionsUseCase, getEmergencyFundUseCase);
export const getRecurringPageUseCase = new GetRecurringPageUseCase(planningReader, inboxReader, accountsReader, categoriesReader, (familyId, today) => listPayPeriodsUseCase.execute(familyId, today));
export const getSettingsPageUseCase = new GetSettingsPageUseCase(categoriesReader, profileReader, listPayPeriodsUseCase, telegramLinkCodes, describeApiTokenUseCase, familySettingsRepo);
export const getTransactionsPageUseCase = new GetTransactionsPageUseCase(accountsReader, categoriesReader, getTransferSuggestionsUseCase, captureRepo, uncategorizedTransactionsRepo);
export const getProjectionPageUseCase = new GetProjectionPageUseCase(getProjectionBaseUseCase, getCashProjectionUseCase);
export const getDashboardPageUseCase = new GetDashboardPageUseCase({
  periods: resolvePeriodContextUseCase,
  accounts: accountsReader,
  categories: categoriesReader,
  planning: planningReader,
  inbox: inboxReader,
  transactions: transactionsReader,
  summary: getDashboardSummaryUseCase,
  calendarOccurrences: getCalendarOccurrencesUseCase,
  explorer: getExplorerUseCase,
  debtCalendar: getDebtCalendarUseCase,
  goalProjections: getGoalProjectionsUseCase,
  insights: getInsightsUseCase,
  emergencyFund: getEmergencyFundUseCase,
});

export const getStatsUseCase = new GetStatsUseCase(getExplorerUseCase, getCashProjectionUseCase, getAccountsBalanceHistoryUseCase, accountsReader, resolvePeriodContextUseCase);
export const getStatsPageUseCase = new GetStatsPageUseCase(getStatsUseCase, getCategoryStatsUseCase, getProjectionBaseUseCase, accountsReader, categoriesReader);
export const getSpendingPageUseCase = new GetSpendingPageUseCase(getCategoryStatsUseCase, getSpendingAnalysisUseCase, getExplorerUseCase, accountsReader, categoriesReader, resolvePeriodContextUseCase);

export const familyOwnership = drizzleFamilyOwnership;

const notificationsRepository = new DrizzleNotificationsRepository();

export const notificationInbox = new NotificationInbox(notificationsRepository);

export const pushSubscriptions = new DrizzlePushSubscriptionsRepository();

const vapidConfig = loadVapidConfig();

export const pushPublicKey: string | null = vapidConfig?.publicKey ?? null;

export const notificationChannel: NotificationChannel = new CompositeNotificationChannel([
  new TelegramNotificationChannel(telegramSender),
  ...(vapidConfig ? [new WebPushNotificationChannel(pushSubscriptions, new WebPushSender(vapidConfig))] : []),
]);

export const generateNotificationsUseCase = new GenerateNotificationsUseCase(
  new DrizzleFamilyDirectory(),
  getDashboardPageUseCase,
  getBudgetsPageUseCase,
  notificationsRepository,
  notificationChannel,
);
