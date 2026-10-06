import { periodLabel } from "@/domain/payPeriod/rules";
import { periodOptions, resolvePeriodSelection } from "@/domain/payPeriod/selection";
import type { ListPayPeriodsUseCase } from "../listPayPeriods";

export class ResolvePeriodContextUseCase {
  constructor(private readonly periods: ListPayPeriodsUseCase) {}

  async execute(familyId: number, today: string, periodsParam: string | undefined) {
    const allPeriods = await this.periods.execute(familyId, today);
    const selection = resolvePeriodSelection(allPeriods, periodsParam, today);
    const { displayPeriod } = selection;

    return {
      ...selection,
      header: {
        periodLabel: periodLabel(displayPeriod.start, displayPeriod.end),
        periods: periodOptions(allPeriods, selection.currentIndex),
        selectedIds: selection.selectedIds,
      },
    };
  }
}
