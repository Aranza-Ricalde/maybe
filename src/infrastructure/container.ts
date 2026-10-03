import { AcceptRecurringCandidateUseCase } from "@/application/acceptRecurringCandidate";
import { ArchiveOrDeleteAccountUseCase } from "@/application/archiveOrDeleteAccount";
import { BootstrapFamilyUseCase } from "@/application/bootstrapFamily";
import { CleanMerchantNameUseCase } from "@/application/cleanMerchantName";
import { CreateAccountUseCase } from "@/application/createAccount";
import { CreateCategoryUseCase } from "@/application/createCategory";
import { CreateConceptUseCase } from "@/application/createConcept";
import { CreateGoalUseCase } from "@/application/createGoal";
import { CreatePayPeriodUseCase } from "@/application/createPayPeriod";
import { CreateProviderUseCase } from "@/application/createProvider";
import { CreateRecurringItemUseCase } from "@/application/createRecurringItem";
import { DeleteBudgetLineUseCase } from "@/application/deleteBudgetLine";
import { DeleteCategoryUseCase } from "@/application/deleteCategory";
import { DeleteConceptUseCase } from "@/application/deleteConcept";
import { DeleteGoalUseCase } from "@/application/deleteGoal";
import { DeletePayPeriodUseCase } from "@/application/deletePayPeriod";
import { DeleteProviderUseCase } from "@/application/deleteProvider";
import { DeleteRecurringItemUseCase } from "@/application/deleteRecurringItem";
import { DeleteTransactionUseCase } from "@/application/deleteTransaction";
import { DetectRecurringItemsUseCase } from "@/application/detectRecurringItems";
import { DismissRecurringCandidateUseCase } from "@/application/dismissRecurringCandidate";
import { ConfirmConceptSuggestionUseCase } from "@/application/confirmConceptSuggestion";
import { RejectConceptSuggestionUseCase } from "@/application/rejectConceptSuggestion";
import { GetAccountBalanceHistoryUseCase } from "@/application/getAccountBalanceHistory";
import { GetDashboardSummaryUseCase } from "@/application/getDashboardSummary";
import { GetFinancialEvolutionUseCase } from "@/application/getFinancialEvolution";
import { HandleTelegramMessageUseCase } from "@/application/handleTelegramMessage";
import { ImportCsvUseCase } from "@/application/importCsv";
import { LinkTelegramUseCase } from "@/application/linkTelegram";
import { ListPayPeriodsUseCase } from "@/application/listPayPeriods";
import { LoginUseCase } from "@/application/login";
import { LogoutUseCase } from "@/application/logout";
import { ProjectCashflowUseCase } from "@/application/projectCashflow";
import { RecordTransactionUseCase } from "@/application/recordTransaction";
import { RecordTransferUseCase } from "@/application/recordTransfer";
import { RefreshAccessTokenUseCase } from "@/application/refreshAccessToken";
import { ResolveTransactionConceptUseCase } from "@/application/resolveTransactionConcept";
import { RestoreAccountUseCase } from "@/application/restoreAccount";
import { SetBudgetLineUseCase } from "@/application/setBudgetLine";
import { ToggleRecurringItemStatusUseCase } from "@/application/toggleRecurringItemStatus";
import { UpdateAccountUseCase } from "@/application/updateAccount";
import { UpdateCategoryUseCase } from "@/application/updateCategory";
import { UpdateConceptUseCase } from "@/application/updateConcept";
import { UpdateGoalUseCase } from "@/application/updateGoal";
import { UpdatePayPeriodUseCase } from "@/application/updatePayPeriod";
import { UpdateProviderUseCase } from "@/application/updateProvider";
import { UpdateRecurringItemUseCase } from "@/application/updateRecurringItem";
import { UpdateTransactionUseCase } from "@/application/updateTransaction";
import { ValidateAccessTokenUseCase } from "@/application/validateAccessToken";
import { JoseAccessTokenIssuer, loadAuthSecret } from "./auth/accessTokens";
import { ScryptPasswordHasher } from "./auth/passwordHasher";
import { CryptoSessionTokens } from "./auth/sessionTokens";
import { DrizzleAccountsRepository } from "./db/accounts";
import { DrizzleAuthRepository } from "./db/auth";
import { DrizzleBudgetsRepository } from "./db/budgets";
import { DrizzleCashflowRepository } from "./db/cashflow";
import { DrizzleCategoriesRepository } from "./db/categories";
import { db } from "./db/client";
import { DrizzleConceptsRepository } from "./db/concepts";
import { DrizzleImportMappingRepository, DrizzleImportRepository } from "./db/csvImport";
import { DrizzleDashboardRepository } from "./db/dashboard";
import { DrizzleGoalsRepository } from "./db/goals";
import { DrizzleLedgerUnitOfWork } from "./db/ledger";
import { DrizzleConceptMatchingRepository } from "./db/matching";
import { DrizzleMerchantPatternRepository } from "./db/merchants";
import { DrizzlePayPeriodsRepository } from "./db/payPeriods";
import { DrizzleProvidersRepository } from "./db/providers";
import { DrizzleRecurringCandidateRepository } from "./db/recurring";
import { DrizzleRecurringItemsRepository } from "./db/recurringItems";
import { DrizzleTelegramRepository } from "./db/telegram";
import { GeminiMerchantNameCleaner } from "./gemini/merchantNameCleaner";
import { TelegramApiSender } from "./telegram/sender";

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
export const createProviderUseCase = new CreateProviderUseCase(providersRepo);
export const updateProviderUseCase = new UpdateProviderUseCase(providersRepo);
export const deleteProviderUseCase = new DeleteProviderUseCase(providersRepo);

const conceptsRepo = new DrizzleConceptsRepository();
export const createConceptUseCase = new CreateConceptUseCase(conceptsRepo);
export const updateConceptUseCase = new UpdateConceptUseCase(conceptsRepo);
export const deleteConceptUseCase = new DeleteConceptUseCase(conceptsRepo);

const recurringCandidatesRepo = new DrizzleRecurringCandidateRepository();
const recurringItemsRepo = new DrizzleRecurringItemsRepository();
export const createRecurringItemUseCase = new CreateRecurringItemUseCase(recurringItemsRepo, conceptsRepo);
export const updateRecurringItemUseCase = new UpdateRecurringItemUseCase(recurringItemsRepo, conceptsRepo);
export const deleteRecurringItemUseCase = new DeleteRecurringItemUseCase(recurringItemsRepo, recurringCandidatesRepo);
export const toggleRecurringItemStatusUseCase = new ToggleRecurringItemStatusUseCase(recurringItemsRepo);
export const acceptRecurringCandidateUseCase = new AcceptRecurringCandidateUseCase(recurringCandidatesRepo, recurringItemsRepo, conceptsRepo);
export const dismissRecurringCandidateUseCase = new DismissRecurringCandidateUseCase(recurringCandidatesRepo);

export const recordTransactionUseCase = new RecordTransactionUseCase(new DrizzleLedgerUnitOfWork(db));
export const updateTransactionUseCase = new UpdateTransactionUseCase(new DrizzleLedgerUnitOfWork(db));
export const deleteTransactionUseCase = new DeleteTransactionUseCase(new DrizzleLedgerUnitOfWork(db));
export const recordTransferUseCase = new RecordTransferUseCase(new DrizzleLedgerUnitOfWork(db));
export const detectRecurringItemsUseCase = new DetectRecurringItemsUseCase(recurringCandidatesRepo);
const cashflowRepo = new DrizzleCashflowRepository();
export const projectCashflowUseCase = new ProjectCashflowUseCase(cashflowRepo);
export const getDashboardSummaryUseCase = new GetDashboardSummaryUseCase(new DrizzleDashboardRepository(), cashflowRepo);
const payPeriodsRepo = new DrizzlePayPeriodsRepository();
export const listPayPeriodsUseCase = new ListPayPeriodsUseCase(payPeriodsRepo);
export const createPayPeriodUseCase = new CreatePayPeriodUseCase(payPeriodsRepo);
export const updatePayPeriodUseCase = new UpdatePayPeriodUseCase(payPeriodsRepo);
export const deletePayPeriodUseCase = new DeletePayPeriodUseCase(payPeriodsRepo);
export const getFinancialEvolutionUseCase = new GetFinancialEvolutionUseCase(new DrizzleDashboardRepository());
export const getAccountBalanceHistoryUseCase = new GetAccountBalanceHistoryUseCase(new DrizzleDashboardRepository());
export const importCsvUseCase = new ImportCsvUseCase(
  recordTransactionUseCase,
  new DrizzleImportRepository(),
  new DrizzleImportMappingRepository(),
);
export const cleanMerchantNameUseCase = new CleanMerchantNameUseCase(
  new DrizzleMerchantPatternRepository(),
  new GeminiMerchantNameCleaner(),
  providersRepo,
);
const conceptMatchingRepo = new DrizzleConceptMatchingRepository();
export const resolveTransactionConceptUseCase = new ResolveTransactionConceptUseCase(cleanMerchantNameUseCase, conceptMatchingRepo);
export const confirmConceptSuggestionUseCase = new ConfirmConceptSuggestionUseCase(conceptMatchingRepo, conceptsRepo, updateTransactionUseCase);
export const rejectConceptSuggestionUseCase = new RejectConceptSuggestionUseCase(conceptMatchingRepo);

const telegramRepo = new DrizzleTelegramRepository();
const telegramSender = new TelegramApiSender();
export const linkTelegramUseCase = new LinkTelegramUseCase(telegramRepo, telegramSender);
export const handleTelegramMessageUseCase = new HandleTelegramMessageUseCase(
  telegramRepo,
  recordTransactionUseCase,
  telegramSender,
);
