"use client";

import { ArrowDownRight, ArrowUpRight, Banknote, ChevronDown, CreditCard, Landmark, PiggyBank, Wallet, type LucideIcon } from "lucide-react";
import { useState } from "react";
import type { AccountsBalanceHistory } from "@/application/getAccountsBalanceHistory";
import { Sparkline } from "@/components/atoms/Sparkline";
import { Text } from "@/components/atoms/Text";
import { Progress } from "@/components/ui/progress";
import type { AccountRow } from "@/components/viewModels";
import { creditUtilization } from "@/domain/accounts/rules";
import { ACCOUNT_TYPE_LABELS, formatCurrency, formatPercent, formatPesos, formatSignedPercent, formatSignedPesos } from "@/lib/format";
import { accountChangeView, accountsSubtotalCents, accountSpark, groupAccounts, paymentDayLabel, type AccountGroupKey } from "@/lib/presenters/accounts";
import { cn } from "@/lib/utils";

const GROUP_DOT: Record<AccountGroupKey, string> = { liquid: "bg-success", credit: "bg-warning", loans: "bg-danger" };

const ICON_BY_TYPE: Partial<Record<AccountRow["type"], LucideIcon>> = { savings: PiggyBank, credit_card: CreditCard, loan: Landmark, cash: Banknote };

export interface AccountGroupsListProps {
  rows: AccountRow[];
  history: AccountsBalanceHistory;
  onOpen: (account: AccountRow) => void;
}

function CreditMeta({ account }: { account: AccountRow }) {
  const usage = creditUtilization(account.balanceCents, account.creditLimitCents);
  const due = paymentDayLabel(account.debtTerms.paymentDueDay);
  if (usage == null && !due) return null;
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 max-md:hidden">
      {usage != null && (
        <span className="flex items-center gap-2">
          <Progress value={usage * 100} variant={usage >= 0.8 ? "destructive" : usage >= 0.5 ? "warning" : "success"} aria-label={`Uso del crédito de ${account.name}`} className="h-1 w-24" />
          <Text size="xs" tone="muted">
            {formatPercent(usage)} de {formatPesos(account.creditLimitCents ?? 0)}
          </Text>
        </span>
      )}
      {due && (
        <Text size="xs" tone="muted">
          {due}
        </Text>
      )}
    </span>
  );
}

function AccountRowButton({ account, history, onOpen }: { account: AccountRow; history: AccountsBalanceHistory; onOpen: (account: AccountRow) => void }) {
  const Icon = ICON_BY_TYPE[account.type] ?? Wallet;
  const isDebt = account.type === "credit_card" || account.type === "loan";
  const change = isDebt ? null : accountChangeView(history, account.id);
  const spark = isDebt ? [] : accountSpark(history, account.id);
  const up = (change?.cents ?? 0) > 0;
  return (
    <li>
      <button
        type="button"
        aria-label={`Ver detalle de ${account.name}`}
        onClick={() => onOpen(account)}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-3 text-left transition-colors hover:bg-muted/40 md:grid-cols-[minmax(0,1fr)_14rem_9rem] md:px-5 md:py-4"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex shrink-0 items-center justify-center text-muted-foreground md:size-10 md:rounded-full md:bg-muted">
            <Icon className="size-4 md:size-5" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-medium md:text-base">{account.name}</span>
            <span className="text-xs text-muted-foreground max-md:hidden">{ACCOUNT_TYPE_LABELS[account.type]}</span>
            <CreditMeta account={account} />
          </span>
        </span>
        <span className="flex items-center justify-end gap-3 max-md:hidden">
          {change && change.cents !== 0 && (
            <span className="flex flex-col items-end gap-0.5">
              <Sparkline values={spark} width={96} height={26} className={up ? "text-success" : "text-danger"} />
              <span className={cn("flex items-center gap-1 text-xs font-medium tabular-nums", up ? "text-success" : "text-danger")}>
                {up ? <ArrowUpRight className="size-3" aria-hidden /> : <ArrowDownRight className="size-3" aria-hidden />}
                {formatSignedPesos(change.cents)}
                {change.pct != null && ` (${formatSignedPercent(change.pct)})`}
                <span className="font-normal text-muted-foreground">· 30 días</span>
              </span>
            </span>
          )}
        </span>
        <span className={cn("text-right text-sm font-medium tabular-nums md:text-lg md:font-semibold", account.balanceCents < 0 && "text-danger")}>{formatCurrency(account.balanceCents)}</span>
      </button>
    </li>
  );
}

export function AccountGroupsList({ rows, history, onOpen }: AccountGroupsListProps) {
  const groups = groupAccounts(rows);
  const [open, setOpen] = useState<ReadonlySet<AccountGroupKey>>(new Set(["liquid"]));

  function toggle(key: AccountGroupKey) {
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  return (
    <div role="region" aria-label="Lista de cuentas" className="flex flex-col gap-3">
      {groups.map((group) => {
        const isOpen = open.has(group.key);
        const subtotal = accountsSubtotalCents(group.rows);
        return (
          <section key={group.key} aria-label={group.label} className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            <button type="button" aria-expanded={isOpen} onClick={() => toggle(group.key)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left md:cursor-default md:bg-muted/30 md:px-5">
              <span className="flex min-w-0 flex-col">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className={cn("size-2 rounded-full max-md:hidden", GROUP_DOT[group.key])} aria-hidden />
                  {group.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {group.rows.length} {group.rows.length === 1 ? "cuenta" : "cuentas"}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className={cn("font-semibold tabular-nums md:text-lg", subtotal < 0 && "text-danger")}>{formatCurrency(subtotal)}</span>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform md:hidden", isOpen && "rotate-180")} aria-hidden />
              </span>
            </button>
            <ul className={cn("divide-y border-t", !isOpen && "max-md:hidden")}>
              {group.rows.map((account) => (
                <AccountRowButton key={account.id} account={account} history={history} onOpen={onOpen} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
