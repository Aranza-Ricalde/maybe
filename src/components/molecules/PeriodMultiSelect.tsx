"use client";

import { Calendar, Check } from "@gravity-ui/icons";
import { CloseButton, ListBox, Popover, Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { periodsHref } from "@/domain/shared/routes";

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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<Set<number>>(new Set(selectedIds));
  const [isPending, startNavigationTransition] = useTransition();

  function apply() {
    if (draft.size > 0) {
      const ids = [...draft].sort((a, b) => a - b);
      startNavigationTransition(() => {
        router.push(periodsHref(basePath, ids));
      });
    }
    setIsOpen(false);
  }

  return (
    <Popover.Root
      isOpen={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) setDraft(new Set(selectedIds));
      }}
    >
      <Button variant="secondary" size="sm" isDisabled={isPending} onPress={() => setIsOpen(true)}>
        {isPending ? <Spinner size="sm" /> : <Icon icon={Calendar} size="sm" />}
        Cambiar periodo
      </Button>
      <Popover.Content>
        <Popover.Dialog className="flex max-h-96 w-64 flex-col gap-2 p-2">
          <div className="flex items-center justify-between gap-2 px-1">
            <Popover.Heading className="text-sm">Periodos</Popover.Heading>
            <CloseButton slot="close" />
          </div>
          <button
            type="button"
            onClick={() => setDraft(new Set(periods.filter((p) => p.isCurrent).map((p) => p.id)))}
            className="self-start px-1 text-xs text-accent hover:underline"
          >
            Volver a la quincena actual
          </button>
          <ListBox
            aria-label="Periodos"
            selectionMode="multiple"
            disallowEmptySelection
            selectedKeys={draft}
            onSelectionChange={(keys) => setDraft(keys === "all" ? new Set(periods.map((p) => p.id)) : new Set([...keys].map(Number)))}
            items={periods}
            className="max-h-64 overflow-y-auto"
          >
            {(p) => (
              <ListBox.Item id={p.id} textValue={p.label}>
                <span className="flex-1 text-sm">
                  {p.label}
                  {p.isCurrent && <span className="ml-1 text-xs text-muted">· actual</span>}
                </span>
                <ListBox.ItemIndicator>{(state) => state.isSelected && <Icon icon={Check} size="sm" className="text-accent" />}</ListBox.ItemIndicator>
              </ListBox.Item>
            )}
          </ListBox>
          <Button variant="primary" className="mt-1" onPress={apply}>
            Aplicar
          </Button>
        </Popover.Dialog>
      </Popover.Content>
    </Popover.Root>
  );
}
