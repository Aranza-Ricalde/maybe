import { type DetectionAccount, type DetectionTransaction, type SuggestedTransferKind, type TransferSingleSuggestion } from "./detectionModel";
import { hasSpecificCategory, markersOf } from "./descriptionMarkers";
import { findInstitution, normalizeDescriptionTokens } from "@/domain/merchants/resolver";

const SINGLE_MEDIUM_SCORE = 60;

export function singleSuggestion(tx: DetectionTransaction, account: DetectionAccount | undefined): TransferSingleSuggestion | "undecided" | null {
  if (hasSpecificCategory(tx)) return null;

  const markers = markersOf(tx);
  const institution = findInstitution(normalizeDescriptionTokens(tx.name));
  const outflow = tx.amountCents < 0;
  const reasons: string[] = [];
  let kind: SuggestedTransferKind = "transfer";
  let score = 0;

  if (markers.cardPayment && outflow) {
    kind = "cc_payment";
    score = 70;
    reasons.push("Parece un pago de tarjeta de crédito: el gasto ya se contó cuando compraste con la tarjeta");
  } else if (markers.savings) {
    score = 70;
    reasons.push(outflow ? "Parece dinero que apartas para ahorro (la cuenta destino no está registrada)" : "Parece un depósito a tu cuenta de ahorro (el origen no está registrado)");
    if (!outflow && account && !["savings", "checking"].includes(account.type)) score = 0;
  } else if (markers.generic && institution && outflow && markers.debt) {
    score = SINGLE_MEDIUM_SCORE;
    reasons.push(`Parece un pago de deuda o préstamo por transferencia a ${institution}`);
  }

  if (score > 0 && markers.debt && outflow) {
    kind = "loan_payment";
    reasons.push("Menciona una deuda o préstamo");
  }
  if (score >= SINGLE_MEDIUM_SCORE) {
    return { type: "single", transactionId: tx.id, kind, confidence: "medium", score, reasons };
  }
  return markers.generic ? "undecided" : null;
}
