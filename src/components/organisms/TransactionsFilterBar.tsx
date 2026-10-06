"use client";

import { FunnelXmark } from "@gravity-ui/icons";
import { SearchField } from "@heroui/react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { FilterSelect } from "@/components/molecules/FilterSelect";
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

export interface TransactionsFilterBarProps {
  accounts: AccountOption[];
  categories: CategoryOption[];
  value: TransactionFiltersValue;
  onChange: (value: TransactionFiltersValue) => void;
}

export function TransactionsFilterBar({ accounts, categories, value, onChange }: TransactionsFilterBarProps) {
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
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect label="Cuenta" options={accountOptions} value={value.accountId} onChange={(v) => update("accountId", v)} />
      <FilterSelect label="Categoría" options={categoryOptions} value={value.categoryId} onChange={(v) => update("categoryId", v)} />
      <FilterSelect label="Tipo" options={kindOptions} value={value.kindGroup} onChange={(v) => update("kindGroup", v)} />
      <DateRangeFilter value={value.dateRange} onChange={(v) => update("dateRange", v)} />
      <AmountFilter
        mode={value.amountMode}
        amount={value.amountValue}
        onChange={(mode, amount) => onChange({ ...value, amountMode: mode, amountValue: amount })}
      />
      <SearchField.Root aria-label="Buscar movimientos" value={value.search} onChange={(v) => update("search", v)} className="w-40">
        <SearchField.Group className="rounded-full">
          <SearchField.SearchIcon className="size-3.5" />
          <SearchField.Input placeholder="Buscar…" className="text-xs" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField.Root>

      {hasActiveTransactionFilters(value) && (
        <Button type="button" variant="ghost" size="sm" isIconOnly aria-label="Limpiar todos los filtros" onPress={() => onChange(EMPTY_TRANSACTION_FILTERS)}>
          <Icon icon={FunnelXmark} />
        </Button>
      )}
    </div>
  );
}
