import type { ExplorerBucket, ExplorerRow } from "./rules";

export interface ExplorerRepository {
  aggregate(familyId: number, from: string, to: string, bucket: ExplorerBucket, accountId: number | null): Promise<ExplorerRow[]>;
}
