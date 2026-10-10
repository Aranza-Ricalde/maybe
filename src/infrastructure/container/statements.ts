import { UndoStatementImportUseCase } from "@/application/undoStatementImport";
import { ConfirmStatementImportUseCase } from "@/application/confirmStatementImport";
import { EnrichImportedTransactionsUseCase } from "@/application/enrichImportedTransactions";
import { ParseStatementUseCase } from "@/application/parseStatement";
import { ReconcileStatementUseCase } from "@/application/reconcileStatement";
import { db } from "../db/client";
import { DrizzleLedgerUnitOfWork } from "../db/ledger";
import { DrizzleStatementContextRepository } from "../db/statementContext";
import { DrizzleStatementImportUnitOfWork } from "../db/statementImport";
import { GeminiCategoryClassifier } from "../gemini/categoryClassifier";
import { Sha256StatementHasher } from "../security/sha256Hasher";
import { UnpdfTextExtractor } from "../statements/unpdfExtractor";
import { familyOwnership } from "./pages";
import { categoriesReader } from "./readers";
import { resolveTransactionConceptUseCase, updateTransactionUseCase } from "./core";

const statementContext = new DrizzleStatementContextRepository();
export const reconcileStatementUseCase = new ReconcileStatementUseCase(statementContext, new Sha256StatementHasher());

export const parseStatementUseCase = new ParseStatementUseCase(new UnpdfTextExtractor(), statementContext, reconcileStatementUseCase);
export const undoStatementImportUseCase = new UndoStatementImportUseCase(new DrizzleStatementImportUnitOfWork());
export const confirmStatementImportUseCase = new ConfirmStatementImportUseCase(reconcileStatementUseCase, new DrizzleStatementImportUnitOfWork(), familyOwnership);
export const enrichImportedTransactionsUseCase = new EnrichImportedTransactionsUseCase(
  new DrizzleLedgerUnitOfWork(db),
  categoriesReader,
  updateTransactionUseCase,
  resolveTransactionConceptUseCase,
  process.env.GEMINI_API_KEY ? new GeminiCategoryClassifier() : undefined,
);
