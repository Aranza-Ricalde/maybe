import { useState, useTransition } from "react";
import type { AccountsBalanceHistory } from "@/application/getAccountsBalanceHistory";
import type { EvolutionRangeKey } from "@/domain/evolution/rules";

export type LoadAccountsHistory = (range: EvolutionRangeKey) => Promise<AccountsBalanceHistory>;

const DEFAULT_RANGE: EvolutionRangeKey = "30d";

export function useAccountsHistory(initial: AccountsBalanceHistory, load: LoadAccountsHistory) {
  const [range, setRange] = useState<EvolutionRangeKey>(DEFAULT_RANGE);
  const [cache, setCache] = useState<Partial<Record<EvolutionRangeKey, AccountsBalanceHistory>>>({ [DEFAULT_RANGE]: initial });
  const [isLoading, startTransition] = useTransition();

  return {
    range,
    isLoading,
    history: cache[range] ?? cache[DEFAULT_RANGE] ?? initial,
    selectRange: (next: EvolutionRangeKey) => {
      setRange(next);
      if (cache[next]) return;
      startTransition(async () => {
        const loaded = await load(next);
        setCache((current) => ({ ...current, [next]: loaded }));
      });
    },
  };
}
