import assert from "node:assert/strict";
import { test } from "node:test";
import { describeGoalProjection, etaPhrase, projectGoal, type GoalProjectionInput } from "./projection";

const base: GoalProjectionInput = { currentCents: 1_700_000, targetCents: 2_400_000, balanceAtWindowStartCents: 1_430_000, windowDays: 90, targetDate: null, today: "2026-10-06" };

test("el ejemplo de principios.md: $17,000 de $24,000 (71 %), con el ritmo reciente se estima la fecha", () => {
  const p = projectGoal(base);
  assert.equal(p.remainingCents, 700_000);
  assert.equal(p.dailyPaceCents, 3_000); // $2,700 en 90 días = $30 al día
  assert.equal(p.monthlyPaceCents, 90_000);
  assert.equal(p.etaDays, 234);
  assert.equal(p.etaDate, "2027-05-28");
  assert.equal(p.onTrack, null);
});

test("una meta cumplida no proyecta nada", () => {
  const p = projectGoal({ ...base, currentCents: 2_500_000 });
  assert.equal(p.achieved, true);
  assert.equal(p.remainingCents, 0);
  assert.equal(p.etaDays, null);
  assert.deepEqual(describeGoalProjection(p, null), { headline: "Meta cumplida" });
});

test("sin avance (o retrocediendo) no se inventa una fecha", () => {
  for (const start of [1_700_000, 1_900_000]) {
    const p = projectGoal({ ...base, balanceAtWindowStartCents: start });
    assert.equal(p.etaDays, null);
    assert.equal(p.etaDate, null);
    assert.equal(describeGoalProjection(p, null).headline, "Sin avance en los últimos 90 días");
  }
});

test("un avance diminuto que tardaría más de 10 años tampoco da fecha", () => {
  const p = projectGoal({ ...base, balanceAtWindowStartCents: 1_699_000 });
  assert.equal(p.etaDays, null);
  assert.equal(describeGoalProjection(p, null).headline, "Al ritmo actual tardaría más de 10 años");
});

test("con fecha objetivo: llega a tiempo o dice cuánto faltaría ahorrar por mes", () => {
  const late = projectGoal({ ...base, targetDate: "2027-01-06" });
  assert.equal(late.onTrack, false);
  assert.equal(late.neededMonthlyCents, Math.round((700_000 / 92) * 30));
  assert.match(describeGoalProjection(late, "2027-01-06").detail as string, /Para llegar el 6 ene 2027 harían falta \$2,283 al mes/);

  const early = projectGoal({ ...base, targetDate: "2027-12-31" });
  assert.equal(early.onTrack, true);
  assert.match(describeGoalProjection(early, "2027-12-31").detail as string, /Llegas antes de tu fecha objetivo/);
});

test("una fecha objetivo ya pasada no pide ahorrar 'por mes'", () => {
  assert.equal(projectGoal({ ...base, targetDate: "2026-09-01" }).neededMonthlyCents, null);
});

test("el plazo se dice en la unidad que se entiende (el ejemplo: 7 semanas)", () => {
  assert.equal(etaPhrase(1), "1 día");
  assert.equal(etaPhrase(10), "10 días");
  assert.equal(etaPhrase(49), "unas 7 semanas");
  assert.equal(etaPhrase(234), "unos 8 meses");
});
