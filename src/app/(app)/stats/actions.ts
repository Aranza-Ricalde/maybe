"use server";

import { runFormAction, runQuery } from "@/app/lib/actionRunner";
import { ownsAccount, ownsCategory } from "@/app/lib/ownership";
import { REVALIDATE } from "@/app/lib/revalidation";
import type { StatsData } from "@/application/getStats";
import { InvalidExplorerFiltersError } from "@/domain/explorer/rules";
import { InvalidSettingError } from "@/domain/settings/rules";
import { pesosToCents } from "@/domain/shared/money";
import { normalizeStatsParams } from "@/domain/stats/params";
import { getStatsUseCase, setMinimumBalanceUseCase } from "@/infrastructure/container";
import { minimumBalanceForm, statsArgs } from "@/lib/schemas";
import { todayIso } from "@/lib/today";

export async function loadStatsAction(args: unknown): Promise<StatsData | null> {
  return runQuery(args, {
    schema: statsArgs,
    owns: [ownsAccount((input) => input.accountId), ownsCategory((input) => input.categoryId)],
    run: async (input, user) => {
      try {
        return await getStatsUseCase.execute(user.familyId, normalizeStatsParams(input), todayIso());
      } catch (error) {
        if (error instanceof InvalidExplorerFiltersError) return null;
        throw error;
      }
    },
    whenInvalid: null,
  });
}

export async function setMinimumBalance(formData: FormData) {
  return runFormAction(formData, {
    schema: minimumBalanceForm,
    run: (input, user) => setMinimumBalanceUseCase.execute(user.familyId, pesosToCents(input.minimum)),
    success: "Saldo mínimo actualizado",
    revalidate: REVALIDATE.stats,
    tolerate: [InvalidSettingError],
  });
}
