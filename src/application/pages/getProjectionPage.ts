import type { GetCashProjectionUseCase } from "../getCashProjection";
import type { GetProjectionBaseUseCase } from "../getProjectionBase";

export class GetProjectionPageUseCase {
  constructor(
    private readonly projectionBase: GetProjectionBaseUseCase,
    private readonly cashProjection: GetCashProjectionUseCase,
  ) {}

  async execute(familyId: number, today: string) {
    const [{ basisMonths, assumptions, ...base }, cash] = await Promise.all([this.projectionBase.execute(familyId, today), this.cashProjection.execute(familyId, today)]);
    return { basisMonths, assumptions, base, cash };
  }
}
