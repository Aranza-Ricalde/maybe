import { normalizePeriodView } from "@/domain/payPeriod/periodView";
import type { PeriodViewRepository } from "@/domain/payPeriod/ports";
import { periodLabel } from "@/domain/payPeriod/rules";
import { periodOptions, resolvePeriodSelection } from "@/domain/payPeriod/selection";
import type { ListPayPeriodsUseCase } from "../listPayPeriods";

export class ResolvePeriodContextUseCase {
  constructor(
    private readonly periods: ListPayPeriodsUseCase,
    private readonly views: PeriodViewRepository,
  ) {}

  async execute(familyId: number, today: string, periodsParam: string | undefined) {
    const [allPeriods, storedView] = await Promise.all([this.periods.execute(familyId, today), this.views.get(familyId)]);
    const view = normalizePeriodView(storedView);
    const selection = resolvePeriodSelection(allPeriods, periodsParam, today, view);
    const { displayPeriod } = selection;

    return {
      ...selection,
      header: {
        periodLabel: periodLabel(displayPeriod.start, displayPeriod.end),
        periods: periodOptions(allPeriods, selection.currentIndex, view),
        selectedIds: selection.selectedIds,
        periodView: view,
      },
    };
  }
}
