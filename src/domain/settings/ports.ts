export interface FamilySettingsRepository {
  getMinimumBalanceCents(familyId: number): Promise<number | null>;
  setMinimumBalanceCents(familyId: number, cents: number | null): Promise<void>;
}
