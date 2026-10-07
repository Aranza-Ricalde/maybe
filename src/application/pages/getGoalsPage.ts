import { accountIdsByGoal, goalProjectionInputs, goalRows } from "@/domain/goals/progress";
import type { AccountsReader, PlanningReader } from "@/domain/readModels/ports";
import type { GetEmergencyFundUseCase } from "../getEmergencyFund";
import type { GetGoalProjectionsUseCase } from "../getGoalProjections";

export class GetGoalsPageUseCase {
  constructor(
    private readonly planning: PlanningReader,
    private readonly accounts: AccountsReader,
    private readonly projections: GetGoalProjectionsUseCase,
    private readonly emergencyFund: GetEmergencyFundUseCase,
  ) {}

  async execute(familyId: number, today: string) {
    const [goals, accounts, links, emergencyFund] = await Promise.all([this.planning.goals(familyId), this.accounts.listActive(familyId), this.planning.goalAccountLinks(familyId), this.emergencyFund.execute(familyId, today)]);

    const accountIdsByGoalId = accountIdsByGoal(links);
    const projections = await this.projections.execute(goalProjectionInputs(goals, accountIdsByGoalId), today);

    return {
      rows: goalRows(goals, accountIdsByGoalId, projections, new Map(accounts.map((account) => [account.id, account.name]))),
      accounts,
      emergencyFund,
    };
  }
}
