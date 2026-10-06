import { GetAccountsPageUseCase } from "@/application/pages/getAccountsPage";
import { GetBudgetsPageUseCase } from "@/application/pages/getBudgetsPage";
import { GetDashboardPageUseCase } from "@/application/pages/getDashboardPage";
import { GetGoalsPageUseCase } from "@/application/pages/getGoalsPage";
import { GetProjectionPageUseCase } from "@/application/pages/getProjectionPage";
import { GetRecurringPageUseCase } from "@/application/pages/getRecurringPage";
import { GetSettingsPageUseCase } from "@/application/pages/getSettingsPage";
import { GetTransactionsPageUseCase } from "@/application/pages/getTransactionsPage";
import { drizzleFamilyOwnership } from "../db/authorization";
import { resolvePeriodContextUseCase, getAccountBalanceHistoryUseCase, getCalendarOccurrencesUseCase, getCashProjectionUseCase, getDashboardSummaryUseCase, getDebtCalendarUseCase, getDebtOverviewUseCase, getEmergencyFundUseCase, getFinancialEvolutionUseCase, getGoalProjectionsUseCase, getInsightsUseCase, getProjectionBaseUseCase, getTransferSuggestionsUseCase, getWeeklyFlowUseCase, listPayPeriodsUseCase, telegramLinkCodes } from "./core";
import { captureRepo, describeApiTokenUseCase } from "./captures";
import { accountsReader, categoriesReader, inboxReader, planningReader, profileReader, transactionsReader } from "./readers";



export const getAccountsPageUseCase = new GetAccountsPageUseCase(accountsReader, getAccountBalanceHistoryUseCase);
export const getBudgetsPageUseCase = new GetBudgetsPageUseCase(resolvePeriodContextUseCase, categoriesReader, planningReader);
export const getGoalsPageUseCase = new GetGoalsPageUseCase(planningReader, accountsReader, getGoalProjectionsUseCase);
export const getRecurringPageUseCase = new GetRecurringPageUseCase(planningReader, inboxReader, accountsReader, categoriesReader);
export const getSettingsPageUseCase = new GetSettingsPageUseCase(categoriesReader, profileReader, listPayPeriodsUseCase, telegramLinkCodes, describeApiTokenUseCase);
export const getTransactionsPageUseCase = new GetTransactionsPageUseCase(accountsReader, categoriesReader, getTransferSuggestionsUseCase, captureRepo);
export const getProjectionPageUseCase = new GetProjectionPageUseCase(getProjectionBaseUseCase, getCashProjectionUseCase);
export const getDashboardPageUseCase = new GetDashboardPageUseCase({
  periods: resolvePeriodContextUseCase,
  categories: categoriesReader,
  planning: planningReader,
  inbox: inboxReader,
  transactions: transactionsReader,
  summary: getDashboardSummaryUseCase,
  calendarOccurrences: getCalendarOccurrencesUseCase,
  evolution: getFinancialEvolutionUseCase,
  emergencyFund: getEmergencyFundUseCase,
  debtOverview: getDebtOverviewUseCase,
  debtCalendar: getDebtCalendarUseCase,
  weeklyFlow: getWeeklyFlowUseCase,
  goalProjections: getGoalProjectionsUseCase,
  insights: getInsightsUseCase,
});

export const familyOwnership = drizzleFamilyOwnership;
