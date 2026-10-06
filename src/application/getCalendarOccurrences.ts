import type { CalendarOccurrenceInput } from "@/domain/calendar/rules";
import type { RecurringOccurrencesRepository } from "@/domain/recurring/ports";
import type { SyncRecurringOccurrencesUseCase } from "./syncRecurringOccurrences";

export interface CalendarPeriod {
  start: string;
  end: string;
}

export class GetCalendarOccurrencesUseCase {
  constructor(
    private readonly sync: SyncRecurringOccurrencesUseCase,
    private readonly repo: RecurringOccurrencesRepository,
  ) {}

  async execute(familyId: number, periods: CalendarPeriod[]): Promise<CalendarOccurrenceInput[]> {
    if (periods.length === 0) return [];

    for (const period of periods) {
      await this.sync.execute(familyId, period.start, period.end);
    }

    const start = periods.reduce((min, p) => (p.start < min ? p.start : min), periods[0].start);
    const end = periods.reduce((max, p) => (p.end > max ? p.end : max), periods[0].end);
    const occurrences = await this.repo.listForCalendar(familyId, start, end);

    return occurrences.filter((o) => periods.some((p) => o.expectedDate >= p.start && o.expectedDate <= p.end));
  }
}
