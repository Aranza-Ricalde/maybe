import assert from "node:assert/strict";
import { test } from "node:test";
import { InvalidPeriodViewError } from "@/domain/payPeriod/periodView";
import type { PayPeriodRecord, PayPeriodsRepository, PeriodViewRepository } from "@/domain/payPeriod/ports";
import { InvalidPayPeriodError } from "./createPayPeriod";
import { ListPayPeriodsUseCase } from "./listPayPeriods";
import { ResolvePeriodContextUseCase } from "./pages/resolvePeriodContext";
import { SetPeriodViewUseCase } from "./setPeriodView";
import { UpdatePayMonthUseCase } from "./updatePayMonth";

const FAMILY = 1;

class FakePayPeriods implements PayPeriodsRepository {
  rows: PayPeriodRecord[];

  constructor(rows: Array<{ id: number; start: string; end: string }>) {
    this.rows = rows.map((row) => ({ ...row, familyId: FAMILY }));
  }

  async listForFamily() {
    return this.rows;
  }
  async getById(id: number) {
    return this.rows.find((row) => row.id === id) ?? null;
  }
  async create(familyId: number, start: string, end: string) {
    const row = { id: this.rows.length + 1, familyId, start, end };
    this.rows.push(row);
    return row;
  }
  async update(id: number, start: string, end: string) {
    this.rows = this.rows.map((row) => (row.id === id ? { ...row, start, end } : row));
  }
  async delete(id: number) {
    this.rows = this.rows.filter((row) => row.id !== id);
  }
}

class FakeViews implements PeriodViewRepository {
  stored: string | null = null;
  async get() {
    return this.stored;
  }
  async set(_familyId: number, view: string) {
    this.stored = view;
  }
}

const PERIODS = [
  { id: 3, start: "2026-09-29", end: "2026-10-13" },
  { id: 4, start: "2026-10-14", end: "2026-10-29" },
  { id: 5, start: "2026-10-30", end: "2026-11-12" },
];

test("guardar la vista valida el valor y la persiste", async () => {
  const views = new FakeViews();
  const useCase = new SetPeriodViewUseCase(views);
  await useCase.execute(FAMILY, "biweekly");
  assert.equal(views.stored, "biweekly");
  await assert.rejects(useCase.execute(FAMILY, "semanal"), InvalidPeriodViewError);
  assert.equal(views.stored, "biweekly");
});

test("el contexto usa la vista guardada: mensual agrupa el mes y quincenal deja la quincena de hoy", async () => {
  const repo = new FakePayPeriods(PERIODS);
  const views = new FakeViews();
  const context = new ResolvePeriodContextUseCase(new ListPayPeriodsUseCase(repo), views);

  const monthly = await context.execute(FAMILY, "2026-10-06", undefined);
  assert.equal(monthly.header.periodView, "monthly");
  assert.deepEqual(monthly.selectedPeriods.map((p) => p.id), [3, 4]);
  assert.deepEqual(monthly.header.periods.map((o) => o.id), [3, 5]);

  views.stored = "biweekly";
  const biweekly = await context.execute(FAMILY, "2026-10-06", undefined);
  assert.equal(biweekly.header.periodView, "biweekly");
  assert.deepEqual(biweekly.selectedPeriods.map((p) => p.id), [3]);
  assert.deepEqual(biweekly.header.periods.map((o) => o.id), [3, 4, 5]);
});

test("editar un mes mueve el inicio de su primera quincena y el fin de su última", async () => {
  const repo = new FakePayPeriods(PERIODS);
  await new UpdatePayMonthUseCase(repo).execute(FAMILY, 4, "2026-09-30", "2026-10-28");
  assert.deepEqual(repo.rows.map((r) => [r.id, r.start, r.end]), [[3, "2026-09-30", "2026-10-13"], [4, "2026-10-14", "2026-10-28"], [5, "2026-10-30", "2026-11-12"]]);
});

test("editar un mes con traslape no cambia nada", async () => {
  const repo = new FakePayPeriods(PERIODS);
  await assert.rejects(new UpdatePayMonthUseCase(repo).execute(FAMILY, 3, "2026-09-29", "2026-10-30"), InvalidPayPeriodError);
  assert.deepEqual(repo.rows.map((r) => [r.id, r.start, r.end]), PERIODS.map((p) => [p.id, p.start, p.end]));
});
