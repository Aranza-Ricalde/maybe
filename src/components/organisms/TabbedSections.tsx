"use client";

import { useState, type ReactNode } from "react";
import { ACTIVE_ACCENT, SegmentedButtons } from "@/components/molecules/SegmentedButtons";

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
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <SegmentedButtons options={visible.map((tab) => ({ value: tab.id, label: `${tab.label} (${tab.count})` }))} value={current.id} onChange={setSelected} activeClassName={ACTIVE_ACCENT} />
      </div>
      {current.content}
    </section>
  );
}
