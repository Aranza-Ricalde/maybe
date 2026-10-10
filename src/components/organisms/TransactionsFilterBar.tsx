"use client";

import { FunnelX, ListFilter, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Icon } from "@/components/atoms/Icon";
import { FilterSelect } from "@/components/molecules/FilterSelect";
import { PillTabs } from "@/components/molecules/PillTabs";
import { ResponsiveDialog } from "@/components/molecules/ResponsiveDialog";
import { QUICK_RANGE_OPTIONS, activeQuickRange, quickRange, type QuickRangeKey } from "@/lib/presenters/dateRanges";
import { AmountFilter, type AmountFilterMode } from "./AmountFilter";
import { DateRangeFilter, type DateRangeValue } from "./DateRangeFilter";
import type { AccountOption, CategoryOption } from "@/components/viewModels";

export interface TransactionFiltersValue {
  accountId: string;
  categoryId: string;
  kindGroup: string;
  dateRange: DateRangeValue;
  amountMode: AmountFilterMode;
  amountValue: string;
  search: string;
}

export const EMPTY_TRANSACTION_FILTERS: TransactionFiltersValue = {
  accountId: "",
  categoryId: "",
  kindGroup: "",
  dateRange: { start: null, end: null },
  amountMode: "min",
  amountValue: "",
  search: "",
};

export function hasActiveTransactionFilters(f: TransactionFiltersValue): boolean {
  return Boolean(f.accountId || f.categoryId || f.kindGroup || f.dateRange.start || f.amountValue || f.search.trim());
}

export function countActiveTransactionFilters(f: TransactionFiltersValue): number {
  return [f.accountId, f.categoryId, f.kindGroup, f.dateRange.start, f.amountValue].filter(Boolean).length;
}

export interface TransactionsFilterBarProps {
  today: string;
  accounts: AccountOption[];
  categories: CategoryOption[];
  value: TransactionFiltersValue;
  onChange: (value: TransactionFiltersValue) => void;
}

function TransactionFilterFields({ accounts, categories, value, onChange }: Omit<TransactionsFilterBarProps, "today">) {
  function update<K extends keyof TransactionFiltersValue>(key: K, next: TransactionFiltersValue[K]) {
    onChange({ ...value, [key]: next });
  }

  const accountOptions = [{ id: "", label: "Todas" }, ...accounts.map((a) => ({ id: String(a.id), label: a.name }))];
  const categoryOptions = [{ id: "", label: "Todas" }, ...categories.map((c) => ({ id: String(c.id), label: c.label ?? c.name }))];
  const kindOptions = [
    { id: "", label: "Todos" },
    { id: "standard", label: "Gastos e ingresos" },
    { id: "transfers", label: "Transferencias y pagos" },
  ];

  return (
    <>
      <FilterSelect label="Cuenta" options={accountOptions} value={value.accountId} onChange={(v) => update("accountId", v)} />
      <FilterSelect label="Categoría" options={categoryOptions} value={value.categoryId} onChange={(v) => update("categoryId", v)} />
      <FilterSelect label="Tipo" options={kindOptions} value={value.kindGroup} onChange={(v) => update("kindGroup", v)} />
      <DateRangeFilter value={value.dateRange} onChange={(v) => update("dateRange", v)} />
      <AmountFilter mode={value.amountMode} amount={value.amountValue} onChange={(mode, amount) => onChange({ ...value, amountMode: mode, amountValue: amount })} />
    </>
  );
}

export function TransactionsFilterBar(props: TransactionsFilterBarProps) {
  const { value, onChange } = props;
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const activeCount = countActiveTransactionFilters(value);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="hidden flex-wrap items-center gap-2 md:contents">
        <TransactionFilterFields accounts={props.accounts} categories={props.categories} value={value} onChange={onChange} />
      </div>

      <ResponsiveDialog
        title="Filtros"
        description="Elige qué movimientos quieres ver."
        size="md"
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        trigger={
          <Button type="button" variant="outline" size="sm" className="rounded-full md:hidden">
            <Icon icon={ListFilter} />
            {activeCount > 0 ? `Filtros · ${activeCount}` : "Filtros"}
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <TransactionFilterFields accounts={props.accounts} categories={props.categories} value={value} onChange={onChange} />
        </div>
        <Button type="button" onClick={() => setIsSheetOpen(false)}>
          Ver resultados
        </Button>
      </ResponsiveDialog>

      <div className="w-full md:hidden">
        <PillTabs ariaLabel="Rango de fechas" options={[...QUICK_RANGE_OPTIONS]} value={activeQuickRange({ start: value.dateRange.start, end: value.dateRange.end }, props.today)} onChange={(key) => onChange({ ...value, dateRange: quickRange(key as QuickRangeKey, props.today) })} />
      </div>

      <InputGroup className="h-8 w-full rounded-full md:w-44 max-md:order-first">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput aria-label="Buscar movimientos" placeholder="Buscar…" value={value.search} onChange={(event) => onChange({ ...value, search: event.target.value })} className="text-base md:text-xs" />
        {value.search && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" aria-label="Limpiar búsqueda" onClick={() => onChange({ ...value, search: "" })}>
              <X />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>

      {hasActiveTransactionFilters(value) && (
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Limpiar todos los filtros" onClick={() => onChange(EMPTY_TRANSACTION_FILTERS)}>
          <Icon icon={FunnelX} />
        </Button>
      )}
    </div>
  );
}
