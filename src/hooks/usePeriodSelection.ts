import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { periodsHref } from "@/domain/shared/routes";
import { sortedIds, togglePeriod } from "@/lib/presenters/periodSelection";

export function usePeriodSelection(selectedIds: number[], basePath: string, currentIds: number[]) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<ReadonlySet<number>>(new Set(selectedIds));
  const [isPending, startNavigationTransition] = useTransition();

  return {
    isOpen,
    isPending,
    draft,
    onOpenChange: (open: boolean) => {
      setIsOpen(open);
      if (open) setDraft(new Set(selectedIds));
    },
    toggle: (id: number, checked: boolean) => setDraft((current) => togglePeriod(current, id, checked)),
    resetToCurrent: () => setDraft(new Set(currentIds)),
    apply: () => {
      startNavigationTransition(() => router.push(periodsHref(basePath, sortedIds(draft))));
      setIsOpen(false);
    },
  };
}
