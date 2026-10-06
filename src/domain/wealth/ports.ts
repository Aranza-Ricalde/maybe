export interface EmergencyFundGoal {
  targetAmountCents: number;
  accountIds: number[];
}

export interface EmergencyFundGoalRepository {
  findEmergencyFundGoal(familyId: number): Promise<EmergencyFundGoal | null>;
}
