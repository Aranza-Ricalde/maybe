"use client";

import type { ProjectionAssumptions, ProjectionBase } from "@/domain/projection/rules";
import { EmptyState } from "@/components/molecules/EmptyState";
import { ResponsiveDialog } from "@/components/molecules/ResponsiveDialog";
import { ProjectionSimulator } from "./ProjectionSimulator";

export interface ScenarioSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simulator: { base: ProjectionBase; basisMonths: string[]; assumptions: ProjectionAssumptions };
}

export function ScenarioSheet({ open, onOpenChange, simulator }: ScenarioSheetProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Simular escenario" description="Cambia una decisión y mira cómo se mueve tu saldo mes a mes." size="xl">
      {simulator.basisMonths.length === 0 ? (
        <EmptyState title="Todavía no hay con qué proyectar" description="Necesitas al menos un mmes completo con movimientos para estimar tus promedios." />
      ) : (
        <ProjectionSimulator base={simulator.base} basisMonths={simulator.basisMonths} assumptions={simulator.assumptions} />
      )}
    </ResponsiveDialog>
  );
}
