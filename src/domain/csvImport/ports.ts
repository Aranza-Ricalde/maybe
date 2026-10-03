import type { ColumnMapping } from "./rules";

export interface ImportRecord {
  id: number;
  familyId: number;
  filename: string;
  status: "pending" | "completed" | "failed";
}

export interface ImportRepository {
  createImport(familyId: number, filename: string): Promise<ImportRecord>;
  markImportStatus(importId: number, status: "completed" | "failed"): Promise<void>;
}

export interface ImportMappingRepository {
  findMapping(familyId: number, signature: string): Promise<ColumnMapping | null>;
  saveMapping(familyId: number, signature: string, mapping: ColumnMapping): Promise<void>;
}
