import { ResolvePeriodContextUseCase } from "@/application/pages/resolvePeriodContext";
import { AcceptRecurringCandidateUseCase } from "@/application/acceptRecurringCandidate";
import { ArchiveOrDeleteAccountUseCase } from "@/application/archiveOrDeleteAccount";
import { BootstrapFamilyUseCase } from "@/application/bootstrapFamily";
import { CleanMerchantNameUseCase } from "@/application/cleanMerchantName";
import { CreateAccountUseCase } from "@/application/createAccount";
import { CreateCategoryUseCase } from "@/application/createCategory";
import { CreateGoalUseCase } from "@/application/createGoal";
import { CreatePayPeriodUseCase } from "@/application/createPayPeriod";
import { CreateRecurringItemUseCase } from "@/application/createRecurringItem";
import { DecideRecurringBudgetUseCase, ResetRecurringBudgetPolicyUseCase } from "@/application/decideRecurringBudget";
import { DeleteBudgetLineUseCase } from "@/application/deleteBudgetLine";
import { DeleteCategoryUseCase } from "@/application/deleteCategory";
import { DeleteGoalUseCase } from "@/application/deleteGoal";
import { DeletePayPeriodUseCase } from "@/application/deletePayPeriod";
import { DeleteRecurringItemUseCase } from "@/application/deleteRecurringItem";
import { DeleteTransactionUseCase } from "@/application/deleteTransaction";
import { DetectRecurringItemsUseCase } from "@/application/detectRecurringItems";
import { DismissRecurringCandidateUseCase } from "@/application/dismissRecurringCandidate";
import { ConfirmConceptSuggestionUseCase } from "@/application/confirmConceptSuggestion";
import { RejectConceptSuggestionUseCase } from "@/application/rejectConceptSuggestion";
import { GetAccountBalanceHistoryUseCase } from "@/application/getAccountBalanceHistory";
import { GetDashboardSummaryUseCase } from "@/application/getDashboardSummary";
import { SetMinimumBalanceUseCase } from "@/application/setMinimumBalance";
import { GetCashProjectionUseCase } from "@/application/getCashProjection";
import { GetDebtCalendarUseCase } from "@/application/getDebtCalendar";
import { GetDebtOverviewUseCase } from "@/application/getDebtOverview";
import { GetWeeklyFlowUseCase } from "@/application/getWeeklyFlow";
import { GetTrendsUseCase } from "@/application/getTrends";
import { GetGoalProjectionsUseCase } from "@/application/getGoalProjections";
import { GetSpendingAnalysisUseCase } from "@/application/getSpendingAnalysis";
import { GetInsightsUseCase } from "@/application/getInsights";
import { GetEmergencyFundUseCase } from "@/application/getEmergencyFund";
import { GetProjectionBaseUseCase } from "@/application/getProjectionBase";
import { GetFinancialEvolutionUseCase } from "@/application/getFinancialEvolution";
import { ImportCsvUseCase } from "@/application/importCsv";
import { LearnConceptProviderUseCase } from "@/application/learnConceptProvider";
import { LinkTelegramUseCase } from "@/application/linkTelegram";
import { ListPayPeriodsUseCase } from "@/application/listPayPeriods";
import { LoginUseCase } from "@/application/login";
import { LogoutUseCase } from "@/application/logout";
import { ProjectCashflowUseCase } from "@/application/projectCashflow";
import { RecordTransactionUseCase } from "@/application/recordTransaction";
import { RecordTransferUseCase } from "@/application/recordTransfer";
import { RefreshAccessTokenUseCase } from "@/application/refreshAccessToken";
import { ResolveTransferSuggestionUseCase } from "@/application/resolveTransferSuggestion";
import { LearnTransactionCategoryUseCase } from "@/application/learnTransactionCategory";
import { ResolveTransactionConceptUseCase } from "@/application/resolveTransactionConcept";
import { GetTransferSuggestionsUseCase } from "@/application/getTransferSuggestions";
import { GetCategoryStatsUseCase } from "@/application/getCategoryStats";
import type { CategoryStatsReader } from "@/domain/categoryStats/ports";
import { perRequest } from "../requestScope";
import { GetCalendarOccurrencesUseCase } from "@/application/getCalendarOccurrences";
import { LinkOccurrenceTransactionUseCase, ListOccurrencePaymentCandidatesUseCase } from "@/application/linkOccurrenceTransaction";
import { ResolveRecurringOccurrenceUseCase } from "@/application/resolveRecurringOccurrence";
import { SyncRecurringOccurrencesUseCase } from "@/application/syncRecurringOccurrences";
import { RestoreAccountUseCase } from "@/application/restoreAccount";
import { SetBudgetLineUseCase } from "@/application/setBudgetLine";
import { ToggleRecurringItemStatusUseCase } from "@/application/toggleRecurringItemStatus";
import { UpdateAccountUseCase } from "@/application/updateAccount";
import { UpdateCategoryUseCase } from "@/application/updateCategory";
import { UpdateGoalUseCase } from "@/application/updateGoal";
import { UpdatePayPeriodUseCase } from "@/application/updatePayPeriod";
import { UpdateRecurringItemUseCase } from "@/application/updateRecurringItem";
import { UpdateTransactionUseCase } from "@/application/updateTransaction";
import { ValidateAccessTokenUseCase } from "@/application/validateAccessToken";
import { JoseAccessTokenIssuer, loadAuthSecret } from "../auth/accessTokens";
import { ScryptPasswordHasher } from "../auth/passwordHasher";
import { CryptoSessionTokens } from "../auth/sessionTokens";
import { DrizzleAccountsRepository } from "../db/accounts";
import { DrizzleAuthRepository } from "../db/auth";
import { DrizzleBudgetsRepository } from "../db/budgets";
import { DrizzleCashflowRepository } from "../db/cashflow";
import { DrizzleCategoriesRepository } from "../db/categories";
import { db } from "../db/client";
import { DrizzleConceptsRepository } from "../db/concepts";
import { DrizzleImportMappingRepository, DrizzleImportRepository } from "../db/csvImport";
import { DrizzleDashboardRepository } from "../db/dashboard";
import { DrizzleGoalsRepository } from "../db/goals";
import { DrizzleLedgerUnitOfWork } from "../db/ledger";
import { DrizzleCategoryUsageRepository } from "@/infrastructure/db/categoryUsage";
import { DrizzleConceptMatchingRepository } from "../db/matching";
import { DrizzleMerchantPatternRepository } from "../db/merchants";
import { DrizzlePayPeriodsRepository } from "../db/payPeriods";
import { DrizzleProvidersRepository } from "../db/providers";
import { DrizzleRecurringCandidateRepository } from "../db/recurring";
import { DrizzleFamilySettingsRepository } from "../db/familySettings";
import { DrizzleDebtsRepository } from "../db/debts";
import { DrizzleEmergencyFundGoalRepository } from "../db/emergencyFundGoal";
import { DrizzleSpendingAnalysisRepository } from "../db/spendingAnalysis";
import { DrizzleInsightsRepository } from "../db/insights";
import { DrizzleRecurringBudgetRepository } from "../db/recurringBudget";
import { DrizzleRecurringItemsRepository } from "../db/recurringItems";
import { DrizzleRecurringOccurrencesRepository } from "../db/recurringOccurrences";
import { DrizzleCategoryStatsRepository } from "../db/categoryStats";
import { DrizzleTelegramRepository } from "../db/telegram";
import { DrizzleTransferReviewRepository } from "../db/transferReview";
import { GeminiMerchantNameCleaner } from "../gemini/merchantNameCleaner";
import { HmacTelegramLinkCodes } from "../telegram/linkCodes";
import { TelegramApiSender } from "../telegram/sender";
import type { AttemptLimiter } from "@/domain/auth/attemptLimit";
import { DrizzleAttemptLimiter } from "../security/drizzleAttemptLimiter";

const authRepo = new DrizzleAuthRepository();
const passwordHasher = new ScryptPasswordHasher();
const sessionTokens = new CryptoSessionTokens();
const accessTokenIssuer = new JoseAccessTokenIssuer(loadAuthSecret());

export const bootstrapFamilyUseCase = new BootstrapFamilyUseCase(authRepo, passwordHasher);
export const loginUseCase = new LoginUseCase(authRepo, passwordHasher, sessionTokens, accessTokenIssuer);
export const logoutUseCase = new LogoutUseCase(authRepo, sessionTokens);
export const validateAccessTokenUseCase = new ValidateAccessTokenUseCase(accessTokenIssuer);
export const refreshAccessTokenUseCase = new RefreshAccessTokenUseCase(authRepo, sessionTokens, accessTokenIssuer);

const accountsRepo = new DrizzleAccountsRepository();
export const createAccountUseCase = new CreateAccountUseCase(accountsRepo);
export const updateAccountUseCase = new UpdateAccountUseCase(accountsRepo);
export const archiveOrDeleteAccountUseCase = new ArchiveOrDeleteAccountUseCase(accountsRepo);
export const restoreAccountUseCase = new RestoreAccountUseCase(accountsRepo);

const goalsRepo = new DrizzleGoalsRepository();
export const createGoalUseCase = new CreateGoalUseCase(goalsRepo);
export const updateGoalUseCase = new UpdateGoalUseCase(goalsRepo);
export const deleteGoalUseCase = new DeleteGoalUseCase(goalsRepo);

const budgetsRepo = new DrizzleBudgetsRepository();
export const setBudgetLineUseCase = new SetBudgetLineUseCase(budgetsRepo);
export const deleteBudgetLineUseCase = new DeleteBudgetLineUseCase(budgetsRepo);

const categoriesRepo = new DrizzleCategoriesRepository();
export const createCategoryUseCase = new CreateCategoryUseCase(categoriesRepo);
export const updateCategoryUseCase = new UpdateCategoryUseCase(categoriesRepo);
export const deleteCategoryUseCase = new DeleteCategoryUseCase(categoriesRepo);

const providersRepo = new DrizzleProvidersRepository();

const conceptsRepo = new DrizzleConceptsRepository();

const recurringCandidatesRepo = new DrizzleRecurringCandidateRepository();
const recurringItemsRepo = new DrizzleRecurringItemsRepository();
const recurringBudgetRepo = new DrizzleRecurringBudgetRepository();
export const decideRecurringBudgetUseCase = new DecideRecurringBudgetUseCase(recurringBudgetRepo);
export const resetRecurringBudgetPolicyUseCase = new ResetRecurringBudgetPolicyUseCase(recurringBudgetRepo);
export const createRecurringItemUseCase = new CreateRecurringItemUseCase(recurringItemsRepo, conceptsRepo, recurringBudgetRepo);
export const updateRecurringItemUseCase = new UpdateRecurringItemUseCase(recurringItemsRepo, conceptsRepo);
export const deleteRecurringItemUseCase = new DeleteRecurringItemUseCase(recurringItemsRepo, recurringCandidatesRepo);
export const toggleRecurringItemStatusUseCase = new ToggleRecurringItemStatusUseCase(recurringItemsRepo);
const merchantPatternRepo = new DrizzleMerchantPatternRepository();
export const acceptRecurringCandidateUseCase = new AcceptRecurringCandidateUseCase(recurringCandidatesRepo, recurringItemsRepo, conceptsRepo, merchantPatternRepo, recurringBudgetRepo);
export const dismissRecurringCandidateUseCase = new DismissRecurringCandidateUseCase(recurringCandidatesRepo);

export const recordTransactionUseCase = new RecordTransactionUseCase(new DrizzleLedgerUnitOfWork(db));
export const updateTransactionUseCase = new UpdateTransactionUseCase(new DrizzleLedgerUnitOfWork(db));
export const deleteTransactionUseCase = new DeleteTransactionUseCase(new DrizzleLedgerUnitOfWork(db));
export const recordTransferUseCase = new RecordTransferUseCase(new DrizzleLedgerUnitOfWork(db));
const transferReviewRepo = new DrizzleTransferReviewRepository();
export const getTransferSuggestionsUseCase = new GetTransferSuggestionsUseCase(transferReviewRepo);
export const resolveTransferSuggestionUseCase = new ResolveTransferSuggestionUseCase(new DrizzleLedgerUnitOfWork(db), transferReviewRepo);
const categoryStatsUseCase = new GetCategoryStatsUseCase(new DrizzleCategoryStatsRepository());
export const getCategoryStatsUseCase: CategoryStatsReader = { execute: perRequest((familyId: number, today: string) => categoryStatsUseCase.execute(familyId, today)) };
const recurringOccurrencesRepo = new DrizzleRecurringOccurrencesRepository();
export const syncRecurringOccurrencesUseCase = new SyncRecurringOccurrencesUseCase(recurringOccurrencesRepo);
export const resolveRecurringOccurrenceUseCase = new ResolveRecurringOccurrenceUseCase(recurringOccurrencesRepo);
export const listOccurrencePaymentCandidatesUseCase = new ListOccurrencePaymentCandidatesUseCase(recurringOccurrencesRepo);
export const linkOccurrenceTransactionUseCase = new LinkOccurrenceTransactionUseCase(recurringOccurrencesRepo);
export const getCalendarOccurrencesUseCase = new GetCalendarOccurrencesUseCase(syncRecurringOccurrencesUseCase, recurringOccurrencesRepo);
export const detectRecurringItemsUseCase = new DetectRecurringItemsUseCase(recurringCandidatesRepo);
export const dashboardRepo = new DrizzleDashboardRepository();
const cashflowRepo = new DrizzleCashflowRepository();
export const projectCashflowUseCase = new ProjectCashflowUseCase(cashflowRepo);
export const getDashboardSummaryUseCase = new GetDashboardSummaryUseCase(dashboardRepo, cashflowRepo);
const payPeriodsRepo = new DrizzlePayPeriodsRepository();
export const listPayPeriodsUseCase = new ListPayPeriodsUseCase(payPeriodsRepo);
export const resolvePeriodContextUseCase = new ResolvePeriodContextUseCase(listPayPeriodsUseCase);
export const createPayPeriodUseCase = new CreatePayPeriodUseCase(payPeriodsRepo);
export const updatePayPeriodUseCase = new UpdatePayPeriodUseCase(payPeriodsRepo);
export const deletePayPeriodUseCase = new DeletePayPeriodUseCase(payPeriodsRepo);
const insightsRepo = new DrizzleInsightsRepository();
const familySettingsRepo = new DrizzleFamilySettingsRepository();
export const getCashProjectionUseCase = new GetCashProjectionUseCase(cashflowRepo, dashboardRepo, recurringOccurrencesRepo, familySettingsRepo);
export const setMinimumBalanceUseCase = new SetMinimumBalanceUseCase(familySettingsRepo);
const debtsRepo = new DrizzleDebtsRepository();
export const getDebtOverviewUseCase = new GetDebtOverviewUseCase(debtsRepo);
export const getDebtCalendarUseCase = new GetDebtCalendarUseCase(debtsRepo);
export const getWeeklyFlowUseCase = new GetWeeklyFlowUseCase(dashboardRepo);
export const getTrendsUseCase = new GetTrendsUseCase(dashboardRepo);
export const getGoalProjectionsUseCase = new GetGoalProjectionsUseCase(dashboardRepo);
export const getSpendingAnalysisUseCase = new GetSpendingAnalysisUseCase(insightsRepo, new DrizzleSpendingAnalysisRepository(), new DrizzleCategoryStatsRepository());
export const getInsightsUseCase = new GetInsightsUseCase(insightsRepo, getCategoryStatsUseCase, getTransferSuggestionsUseCase);
export const getEmergencyFundUseCase = new GetEmergencyFundUseCase(dashboardRepo, getCategoryStatsUseCase, new DrizzleEmergencyFundGoalRepository());
export const getProjectionBaseUseCase = new GetProjectionBaseUseCase(dashboardRepo, getCategoryStatsUseCase);
export const getFinancialEvolutionUseCase = new GetFinancialEvolutionUseCase(dashboardRepo);
export const getAccountBalanceHistoryUseCase = new GetAccountBalanceHistoryUseCase(dashboardRepo);
export const cleanMerchantNameUseCase = new CleanMerchantNameUseCase(
  merchantPatternRepo,
  providersRepo,
  process.env.MERCHANT_AI_FALLBACK === "on" ? new GeminiMerchantNameCleaner() : undefined,
);
const conceptMatchingRepo = new DrizzleConceptMatchingRepository();
const learnTransactionCategoryUseCase = new LearnTransactionCategoryUseCase(new DrizzleCategoryUsageRepository());
export const resolveTransactionConceptUseCase = new ResolveTransactionConceptUseCase(
  cleanMerchantNameUseCase,
  conceptMatchingRepo,
  learnTransactionCategoryUseCase,
  updateTransactionUseCase,
);
export const importCsvUseCase = new ImportCsvUseCase(
  recordTransactionUseCase,
  new DrizzleImportRepository(),
  new DrizzleImportMappingRepository(),
  resolveTransactionConceptUseCase,
);
const learnConceptProviderUseCase = new LearnConceptProviderUseCase(conceptsRepo, conceptMatchingRepo);
export const confirmConceptSuggestionUseCase = new ConfirmConceptSuggestionUseCase(conceptMatchingRepo, conceptsRepo, updateTransactionUseCase, learnConceptProviderUseCase);
export const rejectConceptSuggestionUseCase = new RejectConceptSuggestionUseCase(conceptMatchingRepo);

export const telegramRepo = new DrizzleTelegramRepository();
export const telegramSender = new TelegramApiSender();
export const telegramLinkCodes = new HmacTelegramLinkCodes();
export const linkTelegramUseCase = new LinkTelegramUseCase(telegramRepo, telegramSender, telegramLinkCodes);

export const loginAttemptLimiter: AttemptLimiter = new DrizzleAttemptLimiter();

export { processedTelegramUpdates } from "../telegram/processedUpdates";
