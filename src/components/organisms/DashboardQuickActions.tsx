"use client";

import { ArrowLeftRight, CircleCheck, FilePlus2, Search } from "lucide-react";
import type { ReactNode } from "react";
import type { FormAction } from "@/lib/actionResult";
import { CalendarEntryListItem, type CalendarEntryListItemProps } from "@/components/molecules/CalendarEntryListItem";
import { ResponsiveDialog } from "@/components/molecules/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AccountOption } from "@/components/viewModels";
import type { CalendarEntry } from "@/domain/calendar/rules";
import { useDashboardShortcuts } from "@/hooks/useDashboardShortcuts";
import { TransferModal } from "./TransferModal";

const TILE = "flex h-16 min-w-0 flex-col items-center justify-center gap-1.5 rounded-none border-0 bg-transparent p-0 text-center whitespace-nowrap shadow-none ring-0 hover:bg-muted/60";

function Tile({ icon: Icon, label }: { icon: typeof Search; label: string }): ReactNode {
  return (
    <>
      <Icon className="size-5 text-primary" aria-hidden />
      <span className="text-xs font-medium">{label}</span>
    </>
  );
}

export interface DashboardQuickActionsProps {
  accounts: AccountOption[];
  today: string;
  recordTransferAction: FormAction;
  entries: CalendarEntry[];
  calendar: Pick<CalendarEntryListItemProps, "decisionAction" | "listPaymentCandidates" | "linkPaymentAction">;
}

export function DashboardQuickActions({ accounts, today, recordTransferAction, entries, calendar }: DashboardQuickActionsProps) {
  const { fileInput, openFilePicker, pickStatements, query, setQuery, isSearching, setIsSearching, submitSearch, openPayments } = useDashboardShortcuts(entries);

  return (
    <nav aria-label="Accesos directos" className="grid grid-cols-4 divide-x overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 md:hidden">
      <TransferModal accounts={accounts} today={today} recordTransferAction={recordTransferAction} trigger={<Tile icon={ArrowLeftRight} label="Transferir" />} triggerClassName={TILE} />

      <ResponsiveDialog title="Marcar pago" description="Pagos de este periodo que siguen pendientes." trigger={<Button type="button" variant="ghost" className={TILE}><Tile icon={CircleCheck} label="Marcar pago" /></Button>}>
        {openPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes pagos pendientes en este periodo.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {openPayments.map((entry) => (
              <CalendarEntryListItem key={entry.occurrenceId ?? `${entry.name}-${entry.expectedDate}`} entry={entry} {...calendar} />
            ))}
          </ul>
        )}
      </ResponsiveDialog>

      <input ref={fileInput} type="file" accept="application/pdf" multiple hidden onChange={pickStatements} />
      <Button type="button" variant="ghost" className={TILE} onClick={openFilePicker}>
        <Tile icon={FilePlus2} label="Importar" />
      </Button>

      <ResponsiveDialog title="Buscar movimiento" description="Escribe parte del nombre." open={isSearching} onOpenChange={setIsSearching} trigger={<Button type="button" variant="ghost" className={TILE}><Tile icon={Search} label="Buscar" /></Button>}>
        <form onSubmit={submitSearch} className="flex flex-col gap-3">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej.: Netflix, gasolina…" aria-label="Buscar movimiento" autoFocus />
          <Button type="submit" disabled={!query.trim()}>
            Buscar
          </Button>
        </form>
      </ResponsiveDialog>
    </nav>
  );
}
