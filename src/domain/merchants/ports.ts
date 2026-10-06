import type { MerchantHistoryEntry } from "./resolver";

export interface MerchantPatternRecord {
  id: number;
  familyId: number;
  rawPattern: string;
  cleanName: string;
  providerId: number | null;
}

export interface MerchantPatternRepository {
  findById(id: number): Promise<MerchantPatternRecord | null>;
  findByPattern(familyId: number, rawPattern: string): Promise<MerchantPatternRecord | null>;
  listHistory(familyId: number): Promise<MerchantHistoryEntry[]>;
  create(familyId: number, rawPattern: string, cleanName: string, providerId: number | null): Promise<MerchantPatternRecord>;
}

export interface MerchantNameCleaner {
  clean(rawDescription: string): Promise<string>;
}
