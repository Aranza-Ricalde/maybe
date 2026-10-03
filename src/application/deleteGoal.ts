import type { GoalsRepository } from "@/domain/goals/ports";

export class DeleteGoalUseCase {
  constructor(private readonly repo: GoalsRepository) {}

  async execute(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
