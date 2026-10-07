import { GetImportPageUseCase } from "@/application/pages/getImportPage";
import { GetAccountsPageUseCase } from "@/application/pages/getAccountsPage";
import { GetBudgetsPageUseCase } from "@/application/pages/getBudgetsPage";
import { GetDashboardPageUseCase } from "@/application/pages/getDashboardPage";
import { GetGoalsPageUseCase } from "@/application/pages/getGoalsPage";
import { GetProjectionPageUseCase } from "@/application/pages/getProjectionPage";
import { GetRecurringPageUseCase } from "@/application/pages/getRecurringPage";
import { GetSpendingPageUseCase } from "@/application/pages/getSpendingPage";
import { GetSettingsPageUseCase } from "@/application/pages/getSettingsPage";
import { GetTransactionsPageUseCase } from "@/application/pages/getTransactionsPage";
import { drizzleFamilyOwnership } from "../db/authorization";
import { familySettingsRepo, getAccountBalanceHistoryUseCase, getCalendarOccurrencesUseCase, getCashProjectionUseCase, getDashboardSummaryUseCase, getDebtCalendarUseCase, getDebtOverviewUseCase, getCategoryStatsUseCase, getEmergencyFundUseCase, getExplorerUseCase, getGoalProjectionsUseCase, getInsightsUseCase, getProjectionBaseUseCase, getSpendingAnalysisUseCase, getTransferSuggestionsUseCase, listPayPeriodsUseCase, resolvePeriodContextUseCase, telegramLinkCodes } from "./core";
import { captureRepo, describeApiTokenUseCase } from "./captures";
import { accountsReader, categoriesReader, inboxReader, planningReader, profileReader, transactionsReader } from "./readers";



export const getAccountsPageUseCase = new GetAccountsPageUseCase(accountsReader, getAccountBalanceHistoryUseCase);
export const getBudgetsPageUseCase = new GetBudgetsPageUseCase(resolvePeriodContextUseCase, categoriesReader, planningReader);
export const getImportPageUseCase = new GetImportPageUseCase(accountsReader, categoriesReader);
export const getGoalsPageUseCase = new GetGoalsPageUseCase(planningReader, accountsReader, getGoalProjectionsUseCase, getEmergencyFundUseCase);
export const getRecurringPageUseCase = new GetRecurringPageUseCase(planningReader, inboxReader, accountsReader, categoriesReader);
export const getSettingsPageUseCase = new GetSettingsPageUseCase(categoriesReader, profileReader, listPayPeriodsUseCase, telegramLinkCodes, describeApiTokenUseCase, familySettingsRepo);
export const getTransactionsPageUseCase = new GetTransactionsPageUseCase(accountsReader, categoriesReader, getTransferSuggestionsUseCase, captureRepo);
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
  debtOverview: getDebtOverviewUseCase,
  debtCalendar: getDebtCalendarUseCase,
  goalProjections: getGoalProjectionsUseCase,
  insights: getInsightsUseCase,
});

export const getSpendingPageUseCase = new GetSpendingPageUseCase(getCategoryStatsUseCase, getSpendingAnalysisUseCase, getExplorerUseCase, accountsReader, categoriesReader, resolvePeriodContextUseCase);

export const familyOwnership = drizzleFamilyOwnership;
