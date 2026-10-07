import { createHash } from "node:crypto";
import type { StatementHasher } from "@/domain/statements/ports";

export class Sha256StatementHasher implements StatementHasher {
  hash(canonicalKey: string): string {
    return createHash("sha256").update(canonicalKey).digest("hex");
  }
}
