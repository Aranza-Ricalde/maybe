export interface AccountBalance {
  accountId: number;
  name: string;
  type: string;
  balanceCents: number;
}

export interface CreditCardAccount extends AccountBalance {
  creditLimitCents: number | null;
}

export interface MonthlyFlow {
  incomeCents: number;
  expenseCents: number;
}

export interface DailyBalancePoint {
  date: string;
  balanceCents: number;
}

export interface MonthlyFlowPoint {
  month: string;
  incomeCents: number;
  expenseCents: number;
}

export interface DailyFlowPoint {
  date: string;
  incomeCents: number;
  expenseCents: number;
}

export interface AccountSnapshotReader {
  getLiquidAccounts(familyId: number, asOfDate: string): Promise<AccountBalance[]>;
  getSavingsAccounts(familyId: number, asOfDate: string): Promise<AccountBalance[]>;
  getAssetAccounts(familyId: number, asOfDate: string): Promise<AccountBalance[]>;
  getCreditCardAccounts(familyId: number, asOfDate: string): Promise<CreditCardAccount[]>;
  getOtherLiabilityAccounts(familyId: number, asOfDate: string): Promise<AccountBalance[]>;
}

export interface BalanceReader {
  getEarliestBalances(accountIds: number[]): Promise<number[]>;
  getPaymentsInto(accountIds: number[], fromDate: string, toDateInclusive: string): Promise<number>;
  getOpeningBalancesAfter(accountIds: number[], date: string): Promise<number>;
  getBalanceAt(accountIds: number[], date: string): Promise<number>;
  getBalancesAtDates(accountIds: number[], dates: string[]): Promise<number[]>;
  getBalancesByAccount(accountIds: number[], date: string): Promise<Map<number, number>>;
  getDailyBalanceSeries(accountIds: number[], fromDate: string, toDateInclusive: string): Promise<DailyBalancePoint[]>;
}

export interface FlowReader {
  getFlowForDateRange(familyId: number, fromDate: string, toDateInclusive: string): Promise<MonthlyFlow>;
  getMonthlyFlowRange(familyId: number, fromMonthInclusive: string, toMonthInclusive: string): Promise<MonthlyFlowPoint[]>;
  getDailyFlow(familyId: number, fromDate: string, toDateInclusive: string): Promise<DailyFlowPoint[]>;
}

export interface DashboardRepository extends AccountSnapshotReader, BalanceReader, FlowReader {}
