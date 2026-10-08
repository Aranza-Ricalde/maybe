"use client";

import { Search } from "lucide-react";
import { Text } from "@/components/atoms/Text";
import { Sparkline } from "@/components/atoms/Sparkline";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStatsTable } from "@/hooks/useStatsTable";
import type { StatsTableModel, StatsTableRow } from "@/lib/presenters/stats";
import { STATS_SORT_OPTIONS, type StatsSort } from "@/lib/presenters/statsFilters";
import { cn } from "@/lib/utils";

const mobileMeta = (model: StatsTableModel, row: StatsTableRow) =>
  model.columns
    .filter((column) => column !== "Tendencia")
    .map((column, index) => `${column}: ${row.cells[index]}`)
    .slice(1)
    .join(" · ");

const TONE_CLASS = { default: "", success: "text-success", danger: "text-danger" } as const;

export interface StatsTableProps {
  model: StatsTableModel;
  nameColumn: string;
  title: string;
  isSelectable: (row: StatsTableRow) => boolean;
  onSelect: (row: StatsTableRow) => void;
}

function RowName({ row }: { row: StatsTableRow }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {row.color && <span className="size-2.5 shrink-0 rounded-full" style={{ background: row.color }} aria-hidden />}
      <span className="truncate font-medium">{row.label}</span>
    </span>
  );
}

function SelectableRow({ row, selectable, onSelect, className, children }: { row: StatsTableRow; selectable: boolean; onSelect: (row: StatsTableRow) => void; className?: string; children: React.ReactNode }) {
  if (!selectable) return <div className={className}>{children}</div>;
  return (
    <button type="button" aria-label={`Filtrar por ${row.label}`} onClick={() => onSelect(row)} className={cn("w-full text-left transition-colors hover:bg-muted", className)}>
      {children}
    </button>
  );
}

export function StatsTable({ model, nameColumn, title, isSelectable, onSelect }: StatsTableProps) {
  const isMobile = useIsMobile();
  const { query, setQuery, sort, setSort, visible } = useStatsTable(model.rows);
  const hasSpark = model.rows.some((row) => row.spark && row.spark.length > 1);

  return (
    <Card aria-label={title}>
      <CardContent className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <InputGroup className="w-44">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar…" aria-label={`Buscar en ${title}`} />
          </InputGroup>
          <Select value={sort} items={STATS_SORT_OPTIONS} onValueChange={(next) => next && setSort(next as StatsSort)}>
            <SelectTrigger size="sm" aria-label="Ordenar">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATS_SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="Sin resultados" description="Prueba con otra búsqueda o cambia el rango." />
      ) : isMobile ? (
        <ul className="flex flex-col divide-y border-y">
          {visible.map((row) => (
            <li key={row.key}>
              <SelectableRow row={row} selectable={isSelectable(row)} onSelect={onSelect} className="flex items-center gap-3 px-1 py-3">
                <div className="min-w-0 flex-1">
                  <RowName row={row} />
                  <Text size="xs" tone="muted" className="line-clamp-2">
                    {mobileMeta(model, row)}
                  </Text>
                </div>
                <span className="shrink-0 font-semibold tabular-nums">{row.cells[0]}</span>
              </SelectableRow>
            </li>
          ))}
          {model.total && (
            <li className="flex items-center justify-between px-1 py-3 font-semibold">
              <span>{model.total.label}</span>
              <span className="tabular-nums">{model.total.cells[0]}</span>
            </li>
          )}
        </ul>
      ) : (
        <Table aria-label={title}>
          <TableHeader>
            <TableRow>
              <TableHead>{nameColumn}</TableHead>
              {model.columns.map((column) => (
                <TableHead key={column} className={column === "Tendencia" ? undefined : "text-right"}>
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => (
              <TableRow key={row.key} className={isSelectable(row) ? "cursor-pointer" : undefined} onClick={isSelectable(row) ? () => onSelect(row) : undefined}>
                <TableCell>
                  <RowName row={row} />
                </TableCell>
                {hasSpark && (
                  <TableCell>
                    <Sparkline values={row.spark ?? []} width={88} height={24} />
                  </TableCell>
                )}
                {row.cells.map((cell, index) => (
                  <TableCell key={index} className={cn("text-right tabular-nums", TONE_CLASS[row.tones?.[index] ?? "default"])}>
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          {model.total && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">{model.total.label}</TableCell>
                {hasSpark && <TableCell />}
                {model.total.cells.map((cell, index) => (
                  <TableCell key={index} className={cn("text-right font-semibold tabular-nums", TONE_CLASS[model.total?.tones?.[index] ?? "default"])}>
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      )}
      </CardContent>
    </Card>
  );
}
