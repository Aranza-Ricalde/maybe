import type { MerchantSpendRow } from "./rules";
import type { SubscriptionAlias } from "./subscriptions";

export interface SpendingAnalysisRepository {
  listMerchantSpend(familyId: number, fromDate: string, toDate: string): Promise<MerchantSpendRow[]>;
  countMonthsWithSpend(familyId: number, fromDate: string, toDate: string): Promise<number>;
}

export interface SubscriptionGroupsRepository {
  listAliases(familyId: number): Promise<SubscriptionAlias[]>;
  mergeAliases(familyId: number, groupName: string, aliasKeys: string[]): Promise<void>;
  dissolveGroup(familyId: number, groupId: number): Promise<void>;
}
