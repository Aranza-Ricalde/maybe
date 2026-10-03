import type { GoalsRepository, NewGoalInput } from "@/domain/goals/ports";
import { assertValidGoalInput } from "@/domain/goals/rules";

export class CreateGoalUseCase {
  constructor(private readonly repo: GoalsRepository) {}

  async execute(input: NewGoalInput): Promise<void> {
    assertValidGoalInput(input.name, input.targetAmountCents);
    await this.repo.create(input);
  }
}
