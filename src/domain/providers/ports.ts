export interface ProviderRecord {
  id: number;
  familyId: number;
  name: string;
}

export interface ProvidersRepository {
  create(familyId: number, name: string): Promise<ProviderRecord>;
  listForFamily(familyId: number): Promise<ProviderRecord[]>;
}
