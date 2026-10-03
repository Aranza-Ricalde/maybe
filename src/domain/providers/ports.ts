export interface ProviderRecord {
  id: number;
  familyId: number;
  name: string;
}

export interface ProvidersRepository {
  findByName(familyId: number, name: string): Promise<ProviderRecord | null>;
  create(familyId: number, name: string): Promise<ProviderRecord>;
  listForFamily(familyId: number): Promise<ProviderRecord[]>;
  update(id: number, name: string): Promise<void>;
  delete(id: number): Promise<void>;
}
