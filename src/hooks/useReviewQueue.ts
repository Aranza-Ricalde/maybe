import { useState } from "react";
import { clampIndex, stepIndex } from "@/lib/reviewQueue";

export interface ReviewQueue<T> {
  item: T | null;
  position: { current: number; total: number; onGo: (delta: number) => void };
}

export function useReviewQueue<T>(items: T[]): ReviewQueue<T> {
  const [index, setIndex] = useState(0);
  const current = clampIndex(index, items.length);
  return {
    item: items[current] ?? null,
    position: { current, total: items.length, onGo: (delta) => setIndex(stepIndex(current, delta, items.length)) },
  };
}
