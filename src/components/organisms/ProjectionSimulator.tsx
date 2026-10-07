"use client";

import { useMemo } from "react";
import { projectBalance, type ProjectionAssumptions, type ProjectionBase } from "@/domain/projection/rules";
import { useScenarioBuilder } from "@/hooks/useScenarioBuilder";
import { formatMonthYearShort } from "@/lib/format";
import { ProjectionBalanceChart } from "./ProjectionBalanceChart";
import { ProjectionScenarioForm } from "./ProjectionScenarioForm";
import { ProjectionSummary } from "./ProjectionSummary";

export function ProjectionSimulator({ base, basisMonths, assumptions }: { base: ProjectionBase; basisMonths: string[]; assumptions: ProjectionAssumptions }) {
  const builder = useScenarioBuilder(String(base.categories[0]?.id ?? ""));
  const result = useMemo(() => projectBalance(base, builder.scenario), [base, builder.scenario]);
  const hasScenario = builder.entries.length > 0;

  const data = [
    { label: "Hoy", baseline: base.startBalanceCents, scenario: base.startBalanceCents },
    ...result.months.map((m) => ({ label: formatMonthYearShort(m.month), baseline: m.baselineBalanceCents, scenario: m.scenarioBalanceCents })),
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ProjectionSummary base={base} result={result} hasScenario={hasScenario} assumptions={assumptions} basisMonthsLabel={`Base: ${basisMonths.length} ${basisMonths.length === 1 ? "mes completo" : "meses completos"} (${basisMonths.map(formatMonthYearShort).join(", ")}).`} />
      <ProjectionBalanceChart data={data} basisMonths={basisMonths} hasScenario={hasScenario} />
      <ProjectionScenarioForm base={base} builder={builder} result={result} />
    </div>
  );
}
