"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface SegmentedOption<V extends string> {
  value: V;
  label: string;
}

export interface SegmentedButtonsProps<V extends string> {
  options: ReadonlyArray<SegmentedOption<V>>;
  value: V;
  onChange: (value: V) => void;
}

export function SegmentedButtons<V extends string>({ options, value, onChange }: SegmentedButtonsProps<V>) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as V)} className="min-w-0 max-w-full">
      <TabsList className="max-w-full justify-start overflow-x-auto">
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value} className="flex-none">
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
