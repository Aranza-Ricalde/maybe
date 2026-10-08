"use client";

import { Calendar } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Icon } from "@/components/atoms/Icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { usePeriodSelection } from "@/hooks/usePeriodSelection";

export interface PeriodMultiSelectOption {
  id: number;
  label: string;
  isCurrent?: boolean;
}

export interface PeriodMultiSelectProps {
  periods: PeriodMultiSelectOption[];
  selectedIds: number[];
  basePath: string;
}

export function PeriodMultiSelect({ periods, selectedIds, basePath }: PeriodMultiSelectProps) {
  const { isOpen, isPending, draft, onOpenChange, toggle, resetToCurrent, apply } = usePeriodSelection(
    selectedIds,
    basePath,
    periods.filter((p) => p.isCurrent).map((p) => p.id),
  );

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="secondary" size="sm" disabled={isPending}>
          {isPending ? <Spinner /> : <Icon icon={Calendar} size="sm" />}
          Cambiar periodo
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex max-h-96 w-72 flex-col gap-2">
        <PopoverHeader>
          <PopoverTitle>Periodos</PopoverTitle>
        </PopoverHeader>
        <Button type="button" variant="link" size="xs" className="h-auto self-start p-0" onClick={resetToCurrent}>
          Volver al periodo actual
        </Button>
        <div role="group" aria-label="Periodos" className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
          {periods.map((period) => (
            <label key={period.id} className="flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-muted">
              <Checkbox checked={draft.has(period.id)} onCheckedChange={(checked) => toggle(period.id, checked === true)} />
              <span className="flex-1">
                {period.label}
                {period.isCurrent && <span className="ml-1 text-xs text-muted-foreground">· actual</span>}
              </span>
            </label>
          ))}
        </div>
        <Button type="button" onClick={apply}>
          Aplicar
        </Button>
      </PopoverContent>
    </Popover>
  );
}
