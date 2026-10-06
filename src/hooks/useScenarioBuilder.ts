import { useMemo, useState } from "react";
import type { ScenarioAdjustment } from "@/domain/projection/rules";
import { buildAdjustment, scenarioFormNeeds, type ScenarioFormValues } from "@/domain/projection/scenarioForm";

export function useScenarioBuilder(defaultCategoryId: string) {
  const [adjustments, setAdjustments] = useState<Array<{ id: number; adjustment: ScenarioAdjustment }>>([]);
  const [nextId, setNextId] = useState(1);
  const [values, setValues] = useState<ScenarioFormValues>({ kind: "cut_category", categoryId: defaultCategoryId, percent: "20", direction: "expense", amount: "", month: "1", repeat: "monthly" });

  const candidate = buildAdjustment(values);
  const scenario = useMemo(() => adjustments.map((a) => a.adjustment), [adjustments]);

  function setValue<K extends keyof ScenarioFormValues>(field: K, value: ScenarioFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function add() {
    if (!candidate) return;
    setAdjustments((list) => [...list, { id: nextId, adjustment: candidate }]);
    setNextId((id) => id + 1);
  }

  return {
    values,
    setValue,
    needs: scenarioFormNeeds(values.kind),
    canAdd: candidate !== null,
    add,
    remove: (id: number) => setAdjustments((list) => list.filter((a) => a.id !== id)),
    clear: () => setAdjustments([]),
    entries: adjustments,
    scenario,
  };
}
