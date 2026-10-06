import type { MerchantSpendRow } from "./rules";

export interface SpendingAnalysisRepository {
  listMerchantSpend(familyId: number, fromDate: string, toDate: string): Promise<MerchantSpendRow[]>;
  countMonthsWithSpend(familyId: number, fromDate: string, toDate: string): Promise<number>;
}
