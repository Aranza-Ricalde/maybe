import type { Flow } from "@/domain/ledger/rules";

export interface ConceptRecord {
  id: number;
  familyId: number;
  name: string;
  categoryId: number;
  providerId: number | null;
  flow: Flow;
}

export interface NewConceptInput {
  familyId: number;
  name: string;
  categoryId: number;
  providerId: number | null;
  flow: Flow;
}

export interface UpdateConceptInput {
  id: number;
  name: string;
  categoryId: number;
  providerId: number | null;
}

export interface ConceptsRepository {
  getById(id: number): Promise<ConceptRecord | null>;
  findByName(familyId: number, name: string): Promise<ConceptRecord | null>;
  listForFamily(familyId: number): Promise<ConceptRecord[]>;
  create(input: NewConceptInput): Promise<ConceptRecord>;
  update(input: UpdateConceptInput): Promise<void>;
  delete(id: number): Promise<void>;
}
