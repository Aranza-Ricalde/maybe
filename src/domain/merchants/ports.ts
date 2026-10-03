export interface MerchantPatternRecord {
  id: number;
  familyId: number;
  rawPattern: string;
  cleanName: string;
  providerId: number | null;
}

export interface MerchantPatternRepository {
  findByPattern(familyId: number, rawPattern: string): Promise<MerchantPatternRecord | null>;
  create(familyId: number, rawPattern: string, cleanName: string, providerId: number | null): Promise<MerchantPatternRecord>;
}

export interface MerchantNameCleaner {
  clean(rawDescription: string): Promise<string>;
}
