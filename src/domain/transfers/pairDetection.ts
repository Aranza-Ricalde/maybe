import { type DetectionAccount, type DetectionTransaction, type SuggestedTransferKind, type TransferDetectionInput, type TransferPairSuggestion, pairKey } from "./detectionModel";
import { daysBetween, hasSpecificCategory, markersOf, mentionsAccount } from "./descriptionMarkers";
import { groupBy } from "@/domain/shared/collections";

const MAX_PAIR_DAYS = 3;
const PAIR_BASE_SCORE = 40;
const MIN_PAIR_SCORE = 65;
const STRONG_PAIR_SCORE = 90;
const AMBIGUITY_MARGIN = 10;

function pairKindOf(a: DetectionAccount, b: DetectionAccount): SuggestedTransferKind {
  const types = [a.type, b.type];
  if (types.includes("credit_card")) return "cc_payment";
  if (types.some((t) => t === "loan" || t === "other_liability")) return "loan_payment";
  return "transfer";
}

interface PairCandidate {
  out: DetectionTransaction;
  inn: DetectionTransaction;
  score: number;
  reasons: string[];
  kind: SuggestedTransferKind;
  capMedium: boolean;
}

function scorePair(out: DetectionTransaction, inn: DetectionTransaction, accounts: Map<number, DetectionAccount>): PairCandidate | null {
  const outAccount = accounts.get(out.accountId);
  const inAccount = accounts.get(inn.accountId);
  if (!outAccount || !inAccount) return null;

  const days = daysBetween(out.date, inn.date);
  if (days > MAX_PAIR_DAYS) return null;

  let score = PAIR_BASE_SCORE;
  const reasons = [`Mismo monto en dos de tus cuentas (${outAccount.name} → ${inAccount.name})`];

  if (days === 0) {
    score += 20;
    reasons.push("El mismo día");
  } else if (days === 1) {
    score += 10;
    reasons.push("Con un día de diferencia");
  } else {
    reasons.push(`Con ${days} días de diferencia`);
  }

  const outMarkers = markersOf(out);
  const inMarkers = markersOf(inn);
  if (outMarkers.any || inMarkers.any) {
    score += 20;
    reasons.push("La descripción habla de una transferencia, pago de tarjeta o ahorro");
    if (outMarkers.any && inMarkers.any) score += 10;
  }
  if (mentionsAccount(out, inAccount) || mentionsAccount(inn, outAccount)) {
    score += 15;
    reasons.push("Una descripción menciona a la otra cuenta");
  }
  if (["credit_card", "savings", "loan", "other_liability"].includes(outAccount.type) || ["credit_card", "savings", "loan", "other_liability"].includes(inAccount.type)) {
    score += 10;
  }
  const deliberate = Number(hasSpecificCategory(out)) + Number(hasSpecificCategory(inn));
  if (deliberate === 2) return null;
  if (deliberate === 1) {
    score -= outMarkers.any || inMarkers.any ? 15 : 30;
    reasons.push("Pero uno de los dos tiene una categoría elegida a propósito");
  }

  return { out, inn, score, reasons, kind: pairKindOf(outAccount, inAccount), capMedium: deliberate === 1 };
}

export function detectPairs(input: TransferDetectionInput, usable: DetectionTransaction[], accounts: Map<number, DetectionAccount>): TransferPairSuggestion[] {
  const outflows = usable.filter((t) => t.amountCents < 0);
  const inflowsByAmount = groupBy(usable.filter((x) => x.amountCents > 0), (t) => t.amountCents);

  const candidates: PairCandidate[] = [];
  for (const out of outflows) {
    for (const inn of inflowsByAmount.get(-out.amountCents) ?? []) {
      if (out.accountId === inn.accountId || input.rejectedPairs.has(pairKey(out.id, inn.id))) continue;
      const candidate = scorePair(out, inn, accounts);
      if (candidate && candidate.score >= MIN_PAIR_SCORE) candidates.push(candidate);
    }
  }
  candidates.sort((a, b) => b.score - a.score);

  const candidatesByOut = groupBy(candidates, (candidate) => candidate.out.id);
  const candidatesByInflow = groupBy(candidates, (candidate) => candidate.inn.id);
  const used = new Set<number>();
  const suggestions: TransferPairSuggestion[] = [];
  for (const c of candidates) {
    if (used.has(c.out.id) || used.has(c.inn.id)) continue;
    used.add(c.out.id);
    used.add(c.inn.id);

    const sharing = new Set([...(candidatesByOut.get(c.out.id) ?? []), ...(candidatesByInflow.get(c.inn.id) ?? [])]);
    const rivals = [...sharing].filter((o) => o !== c && c.score - o.score <= AMBIGUITY_MARGIN);
    const alternativeIds = [...new Set(rivals.flatMap((r) => [r.out.id, r.inn.id]).filter((id) => id !== c.out.id && id !== c.inn.id))];
    const strong = c.score >= STRONG_PAIR_SCORE && rivals.length === 0 && !c.capMedium;
    suggestions.push({
      type: "pair",
      outflowId: c.out.id,
      inflowId: c.inn.id,
      kind: c.kind,
      confidence: strong ? "strong" : "medium",
      score: c.score,
      reasons: alternativeIds.length > 0 ? [...c.reasons, "Hay otro movimiento que también podría ser la contraparte"] : c.reasons,
      alternativeIds,
    });
  }
  return suggestions;
}
