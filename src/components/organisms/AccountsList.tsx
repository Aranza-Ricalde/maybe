"use client";

import { ArrowDownRight, ArrowUpRight, Banknote, CreditCard, Landmark, PiggyBank, Wallet, type LucideIcon } from "lucide-react";
import type { AccountsBalanceHistory } from "@/application/getAccountsBalanceHistory";
import { Text } from "@/components/atoms/Text";
import { Progress } from "@/components/ui/progress";
import { creditUtilization } from "@/domain/accounts/rules";
import { ACCOUNT_TYPE_LABELS, formatCurrency, formatPercent, formatPesos, formatSignedPercent, formatSignedPesos } from "@/lib/format";
import { accountChangeView, accountGroupOf, paymentDayLabel } from "@/lib/presenters/accounts";
import type { AccountRow } from "@/components/viewModels";

export interface AccountsListProps {
  rows: AccountRow[];
  history: AccountsBalanceHistory;
  onOpen: (account: AccountRow) => void;
}

function CreditMeta({ account }: { account: AccountRow }) {
  const usage = creditUtilization(account.balanceCents, account.creditLimitCents);
  const due = paymentDayLabel(account.debtTerms.paymentDueDay);
  if (usage == null && !due) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
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
    </div>
  );
}

const ICON_BY_TYPE: Partial<Record<AccountRow["type"], LucideIcon>> = { savings: PiggyBank, credit_card: CreditCard, loan: Landmark, cash: Banknote };
const GROUP_ACCENT = { liquid: "var(--success)", credit: "var(--warning)", loans: "var(--danger)" } as const;

export function AccountsList({ rows, history, onOpen }: AccountsListProps) {
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((account) => {
        const Icon = ICON_BY_TYPE[account.type] ?? Wallet;
        const group = accountGroupOf(account.type);
        const change = group === "liquid" ? accountChangeView(history, account.id) : null;
        const up = (change?.cents ?? 0) > 0;
        return (
          <li key={account.id} className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-colors hover:bg-muted/40" style={{ borderLeft: `4px solid ${GROUP_ACCENT[group]}` }}>
            <button type="button" onClick={() => onOpen(account)} aria-label={`Ver detalle de ${account.name}`} className="flex w-full flex-col gap-2 p-4 text-left">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="size-4" aria-hidden />
                {ACCOUNT_TYPE_LABELS[account.type]}
              </span>
              <span className="truncate font-semibold">{account.name}</span>
              <span className={`text-2xl font-semibold tracking-tight tabular-nums ${account.balanceCents < 0 ? "text-danger" : ""}`}>{formatCurrency(account.balanceCents)}</span>
              <CreditMeta account={account} />
              {change && change.cents !== 0 && (
                <span className={`flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${up ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                  {up ? <ArrowUpRight className="size-3" aria-hidden /> : <ArrowDownRight className="size-3" aria-hidden />}
                  {formatSignedPesos(change.cents)}
                  {change.pct != null && ` (${formatSignedPercent(change.pct)})`}
                  <span className="font-normal text-muted-foreground"> · 30 días</span>
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
