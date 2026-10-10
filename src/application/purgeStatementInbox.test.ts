import assert from "node:assert/strict";
import { test } from "node:test";
import { PurgeStatementInboxUseCase } from "./purgeStatementInbox";

test("borra los PDF ya resueltos con más de 7 días y devuelve cuántos fueron", async () => {
  let cutoff: Date | null = null;
  const useCase = new PurgeStatementInboxUseCase({
    purgeResolvedFiles: async (before: Date) => {
      cutoff = before;
      return 2;
    },
  });
  assert.equal(await useCase.execute("2026-10-20"), 2);
  assert.equal((cutoff as Date | null)?.toISOString(), "2026-10-13T00:00:00.000Z");
});
