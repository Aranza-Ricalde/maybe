import { merchantKey } from "@/domain/merchants/resolver";
import type { MerchantSpendRow } from "./rules";

export const SUBSCRIPTION_CATEGORY_NAMES = ["suscripciones", "suscripciones y streaming", "streaming"];
export const MAX_MERGE_SUGGESTIONS = 3;
export const MERGE_AMOUNT_TOLERANCE = 0.02;
export const MAX_SUBSCRIPTION_GROUP_NAME_LENGTH = 60;

export class InvalidSubscriptionMergeError extends Error {}

const normalize = (name: string) => name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export const subscriptionAliasKey = (merchant: string) => merchantKey(merchant) || normalize(merchant);

export interface SubscriptionCategory {
  id: number;
  name: string;
  parentId: number | null;
}

export function subscriptionCategoryIds(categories: SubscriptionCategory[]): Set<number> {
  const roots = new Set(categories.filter((c) => SUBSCRIPTION_CATEGORY_NAMES.includes(normalize(c.name))).map((c) => c.id));
  return new Set(categories.filter((c) => roots.has(c.id) || (c.parentId != null && roots.has(c.parentId))).map((c) => c.id));
}

export interface SubscriptionAlias {
  aliasKey: string;
  groupId: number;
  groupName: string;
}

export interface SubscriptionService {
  key: string;
  name: string;
  monthlyCents: number;
  chargeCount: number;
  monthsWithCharge: number;
  members: string[];
  groupId: number | null;
}

export interface SubscriptionMergeSuggestion {
  members: [string, string];
  names: [string, string];
  amountCents: number;
}

export interface SubscriptionSummary {
  monthlyCents: number;
  yearlyCents: number;
  windowMonths: number;
  services: SubscriptionService[];
  suggestions: SubscriptionMergeSuggestion[];
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

interface ServiceAccumulator {
  key: string;
  name: string;
  groupId: number | null;
  byMonth: Map<string, number>;
  chargeCount: number;
  members: Set<string>;
}

function suggestMerges(services: SubscriptionService[], monthsOf: Map<string, Set<string>>): SubscriptionMergeSuggestion[] {
  const suggestions: SubscriptionMergeSuggestion[] = [];
  const used = new Set<string>();
  for (let i = 0; i < services.length; i++) {
    for (let j = i + 1; j < services.length; j++) {
      const a = services[i];
      const b = services[j];
      if (used.has(a.key) || used.has(b.key)) continue;
      const larger = Math.max(a.monthlyCents, b.monthlyCents);
      const sameAmount = larger > 0 && Math.abs(a.monthlyCents - b.monthlyCents) / larger <= MERGE_AMOUNT_TOLERANCE;
      const neverTogether = [...(monthsOf.get(a.key) ?? [])].every((month) => !monthsOf.get(b.key)?.has(month));
      if (!sameAmount || !neverTogether) continue;
      used.add(a.key);
      used.add(b.key);
      suggestions.push({ members: [a.members[0], b.members[0]], names: [a.name, b.name], amountCents: Math.max(a.monthlyCents, b.monthlyCents) });
      if (suggestions.length === MAX_MERGE_SUGGESTIONS) return suggestions;
    }
  }
  return suggestions;
}

export function subscriptionSummary(rows: MerchantSpendRow[], subscriptionIds: Set<number>, monthsCount: number, aliases: SubscriptionAlias[] = []): SubscriptionSummary | null {
  if (monthsCount <= 0) return null;
  const mine = rows.filter((r) => r.categoryId != null && subscriptionIds.has(r.categoryId));
  if (mine.length === 0) return null;

  const aliasByKey = new Map(aliases.map((alias) => [alias.aliasKey, alias]));
  const accumulators = new Map<string, ServiceAccumulator>();
  for (const row of mine) {
    const alias = aliasByKey.get(subscriptionAliasKey(row.merchant));
    const key = alias ? `g:${alias.groupId}` : `m:${subscriptionAliasKey(row.merchant)}`;
    const service = accumulators.get(key) ?? { key, name: alias?.groupName ?? row.merchant, groupId: alias?.groupId ?? null, byMonth: new Map(), chargeCount: 0, members: new Set<string>() };
    service.byMonth.set(row.month, (service.byMonth.get(row.month) ?? 0) + row.totalCents);
    service.chargeCount += row.count;
    service.members.add(row.merchant);
    accumulators.set(key, service);
  }

  const monthsOf = new Map<string, Set<string>>();
  const services: SubscriptionService[] = [...accumulators.values()]
    .map((service) => {
      monthsOf.set(service.key, new Set(service.byMonth.keys()));
      return {
        key: service.key,
        name: service.name,
        monthlyCents: median([...service.byMonth.values()]),
        chargeCount: service.chargeCount,
        monthsWithCharge: service.byMonth.size,
        members: [...service.members].sort((a, b) => a.localeCompare(b)),
        groupId: service.groupId,
      };
    })
    .sort((a, b) => b.monthlyCents - a.monthlyCents || a.name.localeCompare(b.name));

  const monthlyCents = services.reduce((sum, service) => sum + service.monthlyCents, 0);
  return { monthlyCents, yearlyCents: monthlyCents * 12, windowMonths: monthsCount, services, suggestions: suggestMerges(services, monthsOf) };
}

export function assertValidSubscriptionMerge(members: string[], groupName: string): void {
  if (!groupName.trim() || groupName.trim().length > MAX_SUBSCRIPTION_GROUP_NAME_LENGTH) throw new InvalidSubscriptionMergeError("El nombre de la suscripción es obligatorio y de hasta 60 caracteres.");
  if (new Set(members.map(subscriptionAliasKey)).size < 2) throw new InvalidSubscriptionMergeError("Elige al menos dos cargos distintos para fusionar.");
}
