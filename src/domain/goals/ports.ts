export interface GoalRecord {
  id: number;
  familyId: number;
}

export interface NewGoalInput {
  familyId: number;
  name: string;
  targetAmountCents: number;
  targetDate: string | null;
  accountIds: number[];
}

export interface UpdateGoalInput {
  id: number;
  name: string;
  targetAmountCents: number;
  targetDate: string | null;
  accountIds: number[];
}

export interface GoalsRepository {
  getById(id: number): Promise<GoalRecord | null>;
  create(input: NewGoalInput): Promise<void>;
  update(input: UpdateGoalInput): Promise<void>;
  delete(id: number): Promise<void>;
}
