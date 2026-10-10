import assert from "node:assert/strict";
import { test } from "node:test";
import type { AuthenticatedUser } from "@/domain/auth/ports";
import type { NotificationsRepository } from "@/domain/notifications/ports";
import type { PlannedNotification } from "@/domain/notifications/rules";
import { GenerateNotificationsUseCase } from "./generateNotifications";

const user = (id: number, familyId: number): AuthenticatedUser => ({ id, familyId, email: `u${id}@x.mx`, name: "U" });

function build(options: { available?: number; failFamily?: number } = {}) {
  const stored = new Map<string, number>();
  const delivered: string[] = [];
  const resolved: string[] = [];
  const repository = {
    insertIfNew: async (familyId: number, n: PlannedNotification) => {
      const key = `${familyId}:${n.dedupeKey}`;
      if (stored.has(key)) return null;
      stored.set(key, stored.size + 1);
      return stored.size;
    },
    markSent: async () => {},
    lastOfKind: async () => null,
    resolveOpen: async (familyId: number, kind: string) => {
      resolved.push(`${familyId}:${kind}`);
    },
    purgeOlderThan: async () => 3,
  } as unknown as NotificationsRepository;
  const dashboard = {
    execute: async (u: AuthenticatedUser) => {
      if (u.familyId === options.failFamily) throw new Error("boom");
      return {
        summary: { availableToSpend: { availableCents: options.available ?? 10_000 } },
        periodRange: { from: "2026-09-29" },
        calendarEntries: [{ occurrenceId: 1, name: "Netflix", flow: "expense", source: "recurrente", expectedDate: "2026-10-10", expectedAmountCents: 22900, status: "pending", isManual: false, actualName: null, actualDate: null, actualAmountCents: null }],
        pendingCandidates: [{}],
        pendingConceptSuggestions: [],
      };
    },
  };
  const budgets = { execute: async () => ({ rows: [{ depth: 0, categoryId: 4, name: "Ocio", effectiveBudgetedCents: 100_000, actualCents: -90_000, isSavings: false }] }) };
  const channel = { deliver: async (_family: number, n: { title: string }) => void delivered.push(n.title) };
  const directory = { listFamilyUsers: async () => [user(1, 1), user(2, 1), user(3, 2)] };
  const useCase = new GenerateNotificationsUseCase(directory, dashboard as never, budgets as never, repository, channel);
  return { useCase, delivered, resolved };
}

test("genera una vez por familia y entrega por el canal", async () => {
  const { useCase, delivered } = build();
  const result = await useCase.execute("2026-10-10");
  assert.equal(result.families, 2);
  assert.equal(result.created, 6);
  assert.equal(delivered.length, 6);
  assert.equal(result.purged, 3);
});

test("un fallo en una familia no detiene a las demás", async () => {
  const { useCase } = build({ failFamily: 1 });
  const result = await useCase.execute("2026-10-10");
  assert.equal(result.failed, 1);
  assert.equal(result.created, 3);
});

test("con disponible positivo cierra el episodio de negativo", async () => {
  const { useCase, resolved } = build({ available: 5_000 });
  await useCase.execute("2026-10-10");
  assert.deepEqual(resolved.sort(), ["1:cash_negative", "2:cash_negative"]);
});
