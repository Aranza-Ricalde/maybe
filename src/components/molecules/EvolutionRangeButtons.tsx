import { EVOLUTION_RANGES, type EvolutionRangeKey } from "@/domain/evolution/rules";
import { SegmentedButtons } from "./SegmentedButtons";

export const EVOLUTION_RANGE_LABELS: Record<EvolutionRangeKey, string> = { "30d": "30 días", "3m": "3 meses", "6m": "6 meses", "1y": "1 año" };

const RANGE_OPTIONS = EVOLUTION_RANGES.map((range) => ({ value: range, label: EVOLUTION_RANGE_LABELS[range] }));

export function EvolutionRangeButtons({ value, onChange }: { value: EvolutionRangeKey; onChange: (range: EvolutionRangeKey) => void }) {
  return <SegmentedButtons options={RANGE_OPTIONS} value={value} onChange={onChange} />;
}
