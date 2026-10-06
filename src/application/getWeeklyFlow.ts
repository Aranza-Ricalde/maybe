import type { FlowReader } from "@/domain/dashboard/ports";
import { weeklyFlow, type WeeklyFlow } from "@/domain/dashboard/weekly";

export class GetWeeklyFlowUseCase {
  constructor(private readonly repo: FlowReader) {}

  async execute(familyId: number, periodStart: string, periodEnd: string, today: string): Promise<WeeklyFlow[]> {
    const end = periodEnd < today ? periodEnd : today;
    if (end < periodStart) return [];
    const days = await this.repo.getDailyFlow(familyId, periodStart, end);
    return weeklyFlow(days, periodStart, end);
  }
}
