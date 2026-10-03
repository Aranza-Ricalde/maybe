export interface PayPeriodRecord {
  id: number;
  familyId: number;
  start: string;
  end: string;
}

export interface PayPeriodsRepository {
  listForFamily(familyId: number): Promise<PayPeriodRecord[]>;
  getById(id: number): Promise<PayPeriodRecord | null>;
  create(familyId: number, start: string, end: string): Promise<PayPeriodRecord>;
  update(id: number, start: string, end: string): Promise<void>;
  delete(id: number): Promise<void>;
}
