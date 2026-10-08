"use client";

import { ListFilter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fromSelectValue, toSelectValue } from "@/lib/selectValue";

export interface FilterPanelOption {
  id: string;
  label: string;
}

export interface FilterPanelGroup {
  key: string;
  label: string;
  options: FilterPanelOption[];
  value: string;
  onChange: (value: string) => void;
}

export interface FilterPanelProps {
  groups: FilterPanelGroup[];
  onClear: () => void;
}

const labelOf = (group: FilterPanelGroup) => group.options.find((option) => option.id === group.value)?.label ?? group.value;

export function FilterPanel({ groups, onClear }: FilterPanelProps) {
  const active = groups.filter((group) => group.value !== "");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <ListFilter />
            Filtros
            {active.length > 0 && <Badge className="ml-0.5 h-4 min-w-4 px-1">{active.length}</Badge>}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80">
          <FieldGroup className="gap-3">
            {groups.map((group) => (
              <Field key={group.key}>
                <FieldLabel>{group.label}</FieldLabel>
                <Select value={toSelectValue(group.value)} onValueChange={(next) => group.onChange(fromSelectValue(next))}>
                  <SelectTrigger className="w-full" aria-label={group.label}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {group.options.map((option) => (
                      <SelectItem key={option.id} value={toSelectValue(option.id)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ))}
          </FieldGroup>
        </PopoverContent>
      </Popover>

      {active.map((group) => (
        <Badge key={group.key} variant="secondary" className="h-6 gap-1 pr-1">
          <span className="text-muted-foreground">{group.label}:</span> {labelOf(group)}
          <Button type="button" variant="ghost" size="icon-xs" className="size-4" aria-label={`Quitar filtro ${group.label}`} onClick={() => group.onChange("")}>
            <X />
          </Button>
        </Badge>
      ))}

      {active.length > 0 && (
        <Button type="button" variant="ghost" size="xs" aria-label="Limpiar filtros" onClick={onClear}>
          Limpiar
        </Button>
      )}
    </div>
  );
}
