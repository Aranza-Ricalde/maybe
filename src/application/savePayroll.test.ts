import assert from "node:assert/strict";
import { test } from "node:test";
import type { FamilyRecurringItem } from "@/domain/readModels/types";
import { SavePayrollUseCase, type SavePayrollRequest } from "./savePayroll";

const periods = [
  { id: 1, familyId: 1, start: "2026-09-29", end: "2026-10-13" },
  { id: 2, familyId: 1, start: "2026-10-14", end: "2026-10-29" },
  { id: 3, familyId: 1, start: "2026-10-30", end: "2026-11-12" },
];
const item = (id: number, name: string, dayOfMonth: number): FamilyRecurringItem => ({ id, name, flow: "income", estimatedAmountCents: 1000000, categoryId: null, conceptId: null, accountId: null, providerId: null, dayOfMonth, status: "active", budgetInclusion: null });
const base: SavePayrollRequest = { familyId: 1, amount: 15000, frequency: "biweekly", mode: "sync", manualDays: [], categoryId: 20, accountId: 3, today: "2026-10-05" };

function setup(existing: FamilyRecurringItem[]) {
  const calls: string[] = [];
  const useCase = new SavePayrollUseCase({
    listItems: async () => existing,
    listPeriods: async () => periods,
    create: async (input) => void calls.push(`create ${input.name} ${input.dayOfMonth} ${input.estimatedAmount}`),
    update: async (input) => void calls.push(`update ${input.id} ${input.name} ${input.dayOfMonth}`),
    remove: async (id) => void calls.push(`remove ${id}`),
  });
  return { calls, useCase };
}

test("quincenal sincronizada crea un solo recurrente anclado al inicio de cada periodo", async () => {
  const { calls, useCase } = setup([item(9, "Netflix", 10)]);
  await useCase.execute(base);
  assert.deepEqual(calls, ["create Nómina 0 15000"]);
});

test("quincenal con días manuales crea uno por cobro", async () => {
  const { calls, useCase } = setup([]);
  await useCase.execute({ ...base, mode: "manual", manualDays: [29, 14] });
  assert.deepEqual(calls, ["create Nómina · 1ª quincena 14 15000", "create Nómina · 2ª quincena 29 15000"]);
});

test("con nómina previa actualiza en lugar de duplicar, borra el sobrante y no toca otros recurrentes", async () => {
  const { calls, useCase } = setup([item(1, "Nómina · 1ª quincena", 1), item(2, "Nómina · 2ª quincena", 16), item(9, "Netflix", 10)]);
  await useCase.execute(base);
  assert.deepEqual(calls, ["update 1 Nómina 0", "remove 2"]);
});

test("al pasar de quincenal a mensual conserva uno y borra el sobrante", async () => {
  const { calls, useCase } = setup([item(1, "Nómina · 1ª quincena", 14), item(2, "Nómina · 2ª quincena", 29)]);
  await useCase.execute({ ...base, frequency: "monthly", mode: "manual", manualDays: [5] });
  assert.deepEqual(calls, ["update 1 Nómina 5", "remove 2"]);
});

test("un plan inválido no escribe nada", async () => {
  const { calls, useCase } = setup([]);
  await assert.rejects(() => useCase.execute({ ...base, mode: "manual", manualDays: [40, 5] }));
  assert.deepEqual(calls, []);
});
