import { addDays } from "@/domain/payPeriod/rules";

export const GOAL_PACE_WINDOW_DAYS = 90;
export const MAX_ETA_DAYS = 3_650;

export interface GoalProjectionInput {
  currentCents: number;
  targetCents: number;
  balanceAtWindowStartCents: number;
  windowDays: number;
  targetDate: string | null;
  today: string;
}

export interface GoalProjection {
  achieved: boolean;
  remainingCents: number;
  dailyPaceCents: number;
  monthlyPaceCents: number;
  etaDays: number | null;
  etaDate: string | null;
  onTrack: boolean | null;
  neededMonthlyCents: number | null;
}

const DAY_MS = 86_400_000;
const daysUntil = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);

export function projectGoal(input: GoalProjectionInput): GoalProjection {
  const remainingCents = Math.max(0, input.targetCents - input.currentCents);
  const achieved = input.targetCents > 0 && input.currentCents >= input.targetCents;
  const dailyPaceCents = (input.currentCents - input.balanceAtWindowStartCents) / input.windowDays;
  const monthlyPaceCents = Math.round(dailyPaceCents * 30);

  let etaDays: number | null = null;
  if (!achieved && dailyPaceCents > 0) {
    const days = Math.ceil(remainingCents / dailyPaceCents);
    etaDays = days <= MAX_ETA_DAYS ? days : null;
  }
  const etaDate = etaDays != null ? addDays(input.today, etaDays) : null;

  const daysToTarget = input.targetDate ? daysUntil(input.today, input.targetDate) : null;
  const onTrack = achieved || input.targetDate == null ? null : etaDate != null && etaDate <= input.targetDate;
  const neededMonthlyCents = !achieved && daysToTarget != null && daysToTarget > 0 ? Math.round((remainingCents / daysToTarget) * 30) : null;

  return { achieved, remainingCents, dailyPaceCents, monthlyPaceCents, etaDays, etaDate, onTrack, neededMonthlyCents };
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const pesos = (cents: number) => `$${Math.round(Math.abs(cents) / 100).toLocaleString("es-MX")}`;
const dateLabel = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

export function etaPhrase(days: number): string {
  if (days <= 14) return `${days} ${days === 1 ? "día" : "días"}`;
  if (days <= 70) return `unas ${Math.round(days / 7)} semanas`;
  const months = Math.round(days / 30.4);
  return `unos ${months} ${months === 1 ? "mes" : "meses"}`;
}

export interface GoalProjectionMessage {
  headline: string;
  detail?: string;
}

export function describeGoalProjection(projection: GoalProjection, targetDate: string | null): GoalProjectionMessage {
  if (projection.achieved) return { headline: "Meta cumplida" };

  if (projection.etaDays == null || projection.etaDate == null) {
    return {
      headline: projection.dailyPaceCents > 0 ? "Al ritmo actual tardaría más de 10 años" : "Sin avance en los últimos 90 días",
      detail: "Con el ritmo de ahorro reciente no se puede estimar cuándo la alcanzarías.",
    };
  }

  const headline = `Al ritmo actual (${pesos(projection.monthlyPaceCents)} al mes) la alcanzarías en ${etaPhrase(projection.etaDays)}`;
  const parts = [`Alrededor del ${dateLabel(projection.etaDate)}.`];
  if (targetDate && projection.onTrack === false && projection.neededMonthlyCents != null) {
    parts.push(`Para llegar el ${dateLabel(targetDate)} harían falta ${pesos(projection.neededMonthlyCents)} al mes.`);
  } else if (targetDate && projection.onTrack) {
    parts.push(`Llegas antes de tu fecha objetivo (${dateLabel(targetDate)}).`);
  }
  return { headline, detail: parts.join(" ") };
}
