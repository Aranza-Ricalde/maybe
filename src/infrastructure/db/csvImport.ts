import { and, eq } from "drizzle-orm";
import type { ImportMappingRepository, ImportRecord, ImportRepository } from "@/domain/csvImport/ports";
import type { ColumnMapping } from "@/domain/csvImport/rules";
import { db } from "./client";
import { importMappings, imports } from "./schema/imports";

export class DrizzleImportRepository implements ImportRepository {
  async createImport(familyId: number, filename: string): Promise<ImportRecord> {
    const [row] = await db.insert(imports).values({ familyId, filename, status: "pending" }).returning();
    return { id: row.id, familyId: row.familyId, filename: row.filename, status: row.status };
  }

  async markImportStatus(importId: number, status: "completed" | "failed"): Promise<void> {
    await db.update(imports).set({ status }).where(eq(imports.id, importId));
  }
}

export class DrizzleImportMappingRepository implements ImportMappingRepository {
  async findMapping(familyId: number, signature: string): Promise<ColumnMapping | null> {
    const [row] = await db
      .select({ columnMapping: importMappings.columnMapping })
      .from(importMappings)
      .where(and(eq(importMappings.familyId, familyId), eq(importMappings.bankSignature, signature)))
      .limit(1);
    return row?.columnMapping ?? null;
  }

  async saveMapping(familyId: number, signature: string, mapping: ColumnMapping): Promise<void> {
    await db
      .insert(importMappings)
      .values({ familyId, bankSignature: signature, columnMapping: mapping })
      .onConflictDoUpdate({
        target: [importMappings.familyId, importMappings.bankSignature],
        set: { columnMapping: mapping },
      });
  }
}
