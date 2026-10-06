import { merchantKey } from "@/domain/merchants/resolver";
import { groupBy } from "@/domain/shared/collections";

export interface ProviderForMerge {
  id: number;
  name: string;
  references: number;
}

export interface ProviderMergeGroup {
  keep: ProviderForMerge;
  absorb: ProviderForMerge[];
}

const stripAccents = (name: string) => name.normalize("NFD").replace(/[̀-ͯ]/g, "");
const startsUppercase = (name: string) => /^\p{Lu}/u.test(name);

function pickKeeper(group: ProviderForMerge[]): ProviderForMerge {
  const accentedTwin = (p: ProviderForMerge) =>
    stripAccents(p.name) !== p.name && group.some((o) => o.id !== p.id && o.name.toLowerCase() === stripAccents(p.name).toLowerCase());
  return [...group].sort(
    (a, b) =>
      Number(accentedTwin(b)) - Number(accentedTwin(a)) ||
      b.references - a.references ||
      Number(startsUppercase(b.name)) - Number(startsUppercase(a.name)) ||
      a.id - b.id,
  )[0];
}

export function planProviderMerges(providers: ProviderForMerge[]): ProviderMergeGroup[] {
  const byKey = groupBy(providers.filter((provider) => merchantKey(provider.name)), (provider) => merchantKey(provider.name));
  return [...byKey.values()]
    .filter((group) => group.length > 1)
    .map((group) => {
      const keep = pickKeeper(group);
      return { keep, absorb: group.filter((p) => p.id !== keep.id) };
    })
    .sort((a, b) => a.keep.name.localeCompare(b.keep.name));
}
