import type { GoalsRepository, UpdateGoalInput } from "@/domain/goals/ports";
import { assertValidGoalInput } from "@/domain/goals/rules";

export class UpdateGoalUseCase {
  constructor(private readonly repo: GoalsRepository) {}

  async execute(input: UpdateGoalInput): Promise<void> {
    assertValidGoalInput(input.name, input.targetAmountCents);
    await this.repo.update(input);
  }
}
