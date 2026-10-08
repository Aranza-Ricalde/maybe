"use client";

import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface TabbedSection {
  id: string;
  label: string;
  count: number;
  content: ReactNode;
}

export interface TabbedSectionsProps {
  title: string;
  tabs: TabbedSection[];
}

export function TabbedSections({ title, tabs }: TabbedSectionsProps) {
  const visible = tabs.filter((tab) => tab.count > 0);
  const [selected, setSelected] = useState(visible[0]?.id ?? "");
  if (visible.length === 0) return null;
  const current = visible.find((tab) => tab.id === selected) ?? visible[0];

  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b">
        <h2 className="text-base font-semibold">{title}</h2>
        <Tabs value={current.id} onValueChange={setSelected} className="min-w-0 max-w-full">
          <TabsList variant="line" className="max-w-full justify-start overflow-x-auto">
            {visible.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex-none">
                {tab.label}
                <Badge variant="secondary" className="h-4 min-w-4 px-1">
                  {tab.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      {current.content}
    </section>
  );
}
