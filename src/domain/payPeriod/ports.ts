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
  createMissing(familyId: number, ranges: Array<{ start: string; end: string }>): Promise<void>;
  update(id: number, start: string, end: string): Promise<void>;
  delete(id: number): Promise<void>;
}

export interface PeriodViewRepository {
  get(familyId: number): Promise<string | null>;
  set(familyId: number, view: string): Promise<void>;
}
