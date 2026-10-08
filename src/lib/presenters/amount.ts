export type AmountKind = "expense" | "income";

export interface SplitAmount {
  kind: AmountKind;
  magnitude: string;
}

export function splitSignedAmount(value: string | undefined, fallback: AmountKind = "expense"): SplitAmount {
  if (!value) return { kind: fallback, magnitude: "" };
  const negative = value.trim().startsWith("-");
  return { kind: negative ? "expense" : "income", magnitude: value.trim().replace(/^[-+]/, "") };
}

export function joinSignedAmount(kind: AmountKind, magnitude: string): string {
  if (magnitude.trim() === "") return "";
  const absolute = magnitude.trim().replace(/^[-+]/, "");
  return kind === "expense" ? `-${absolute}` : absolute;
}
