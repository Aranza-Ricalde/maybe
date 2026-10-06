export interface LiabilityAccountRecord {
  id: number;
  name: string;
  type: string;
  balanceCents: number;
  details: Record<string, unknown> | null;
}

export interface DebtMovementStats {
  paymentsCents: number;
  interestCents: number;
}

export interface DebtPaymentRecord {
  accountId: number;
  date: string;
  amountCents: number;
  name: string;
}

export interface DebtsRepository {
  listLiabilityAccounts(familyId: number, asOfDate: string): Promise<LiabilityAccountRecord[]>;
  listPayments(accountIds: number[], fromDate: string, toDate: string): Promise<DebtPaymentRecord[]>;
  getMovementStats(accountIds: number[], paymentsFrom: string, interestFrom: string, asOfDate: string): Promise<Map<number, DebtMovementStats>>;
}
