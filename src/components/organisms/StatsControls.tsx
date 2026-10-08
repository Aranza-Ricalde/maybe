"use client";

import { SlidersHorizontal } from "lucide-react";
import { Label } from "@/components/atoms/Label";
import { SegmentedButtons } from "@/components/molecules/SegmentedButtons";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { STATS_METRICS, type StatsGroup, type StatsMetric, type StatsParams } from "@/domain/stats/params";
import { STATS_GROUP_LABELS, STATS_METRIC_LABELS } from "@/lib/presenters/stats";
import { availableGroups, canProject } from "@/lib/presenters/statsControls";

const METRIC_OPTIONS = STATS_METRICS.map((value) => ({ value, label: STATS_METRIC_LABELS[value] }));

export interface StatsControlsProps {
  params: StatsParams;
  canSimulate: boolean;
  onChange: (patch: Partial<StatsParams>) => void;
  onSimulate: () => void;
}

export function StatsControls({ params, canSimulate, onChange, onSimulate }: StatsControlsProps) {
  const groups = availableGroups(params.metric).map((value) => ({ value, label: STATS_GROUP_LABELS[value] }));
  const projectable = canProject(params);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs tracking-[0.07em] text-muted-foreground uppercase">Ver</Label>
          <SegmentedButtons<StatsMetric> options={METRIC_OPTIONS} value={params.metric} onChange={(metric) => onChange({ metric })} />
        </div>
        {groups.length > 1 && (
          <div className="flex items-center gap-2">
            <Label className="text-xs tracking-[0.07em] text-muted-foreground uppercase">Agrupar por</Label>
            <SegmentedButtons<StatsGroup> options={groups} value={params.group} onChange={(group) => onChange({ group })} />
          </div>
        )}
      </div>
      {params.metric === "balance" && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={params.projection} disabled={!projectable} onCheckedChange={(projection) => onChange({ projection })} aria-label="Mostrar proyección" />
            Proyección a 60 días
          </label>
          {canSimulate && (
            <Button type="button" size="sm" variant="outline" onClick={onSimulate}>
              <SlidersHorizontal />
              Simular escenario
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
