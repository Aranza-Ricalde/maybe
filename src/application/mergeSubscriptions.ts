import type { SubscriptionGroupsRepository } from "@/domain/spendingAnalysis/ports";
import { assertValidSubscriptionMerge, subscriptionAliasKey } from "@/domain/spendingAnalysis/subscriptions";

export class MergeSubscriptionsUseCase {
  constructor(private readonly groups: SubscriptionGroupsRepository) {}

  async execute(familyId: number, memberNames: string[], groupName: string): Promise<void> {
    const name = groupName.trim();
    assertValidSubscriptionMerge(memberNames, name);
    const aliasKeys = [...new Set(memberNames.map(subscriptionAliasKey))];
    await this.groups.mergeAliases(familyId, name, aliasKeys);
  }

  async dissolve(familyId: number, groupId: number): Promise<void> {
    await this.groups.dissolveGroup(familyId, groupId);
  }
}
