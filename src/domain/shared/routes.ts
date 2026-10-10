export const ROUTES = {
  dashboard: "/",
  accounts: "/accounts",
  transactions: "/transactions",
  budgets: "/budgets",
  spending: "/spending",
  stats: "/stats",
  recurring: "/recurring",
  projection: "/projection",
  goals: "/budgets",
  import: "/import",
  settings: "/settings",
  login: "/login",
  apiLogin: "/api/login",
  apiLogout: "/api/logout",
  apiTelegramWebhook: "/api/telegram/webhook",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

export const SEARCH_PARAM = {
  periods: "periods",
  categoryId: "categoryId",
  from: "from",
  to: "to",
  error: "error",
  newTransaction: "nuevo",
  search: "q",
} as const;

export const NEW_TRANSACTION_FLAG = "1";

export const searchTransactionsHref = (query: string) => `${ROUTES.transactions}?${SEARCH_PARAM.search}=${encodeURIComponent(query.trim())}`;

export const newTransactionHref = () => `${ROUTES.transactions}?${SEARCH_PARAM.newTransaction}=${NEW_TRANSACTION_FLAG}`;

export interface PeriodsSearchParams {
  [SEARCH_PARAM.periods]?: string;
}

export interface TransactionsSearchParams {
  [SEARCH_PARAM.categoryId]?: string;
  [SEARCH_PARAM.from]?: string;
  [SEARCH_PARAM.to]?: string;
  [SEARCH_PARAM.newTransaction]?: string;
  [SEARCH_PARAM.search]?: string;
}

export interface LoginSearchParams {
  [SEARCH_PARAM.error]?: string;
}

export const LOGIN_ERRORS = { invalidCredentials: "1", locked: "locked" } as const;

export function loginErrorHref(error: (typeof LOGIN_ERRORS)[keyof typeof LOGIN_ERRORS]): string {
  return `${ROUTES.login}?${SEARCH_PARAM.error}=${error}`;
}

export function periodsHref(basePath: string, periodIds: number[]): string {
  return `${basePath}?${SEARCH_PARAM.periods}=${periodIds.join(",")}`;
}

export function transactionsDrilldownHref(categoryId: number, from: string, to: string): string {
  return `${ROUTES.transactions}?${SEARCH_PARAM.categoryId}=${categoryId}&${SEARCH_PARAM.from}=${from}&${SEARCH_PARAM.to}=${to}`;
}
