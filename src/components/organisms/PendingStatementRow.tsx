import { Text } from "@/components/atoms/Text";
import type { AccountOption } from "@/components/viewModels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemTitle } from "@/components/ui/item";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { STATEMENT_BANKS, STATEMENT_BANK_LABELS, type StatementBank } from "@/domain/statements/types";
import { STATUS_LABEL, type QueueItem } from "@/lib/statementQueue";

export interface PendingStatementRowProps {
  item: QueueItem;
  accounts: AccountOption[];
  onConfigure: (change: { bank?: StatementBank | null; accountId?: number | null; password?: string }) => void;
  onRetry: () => void;
  onRemove: () => void;
}

export function PendingStatementRow({ item, accounts, onConfigure, onRetry, onRemove }: PendingStatementRowProps) {
  const canRetry = item.status !== "configuring" && item.bank !== null && item.accountId !== null;

  return (
    <Item size="sm" className="flex-wrap px-0">
      <ItemContent className="min-w-48">
        <ItemTitle className="truncate">{item.file.name}</ItemTitle>
        <ItemDescription>{item.message ? `${STATUS_LABEL[item.status]}: ${item.message}` : STATUS_LABEL[item.status]}</ItemDescription>
      </ItemContent>
      <ItemActions className="flex-wrap">
        <NativeSelect size="sm" aria-label={`Banco de ${item.file.name}`} value={item.bank ?? ""} onChange={(event) => onConfigure({ bank: (event.target.value || null) as StatementBank | null })}>
          <NativeSelectOption value="">¿De qué banco es?</NativeSelectOption>
          {STATEMENT_BANKS.map((bank) => (
            <NativeSelectOption key={bank} value={bank}>
              {STATEMENT_BANK_LABELS[bank]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect size="sm" aria-label={`Cuenta de ${item.file.name}`} value={item.accountId ?? ""} onChange={(event) => onConfigure({ accountId: event.target.value ? Number(event.target.value) : null })}>
          <NativeSelectOption value="">¿A qué cuenta va?</NativeSelectOption>
          {accounts.map((account) => (
            <NativeSelectOption key={account.id} value={account.id}>
              {account.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {item.status === "password" && <Input type="password" aria-label="Contraseña del PDF" placeholder="Contraseña del PDF" className="h-8 w-44 text-base md:text-xs" value={item.password} onChange={(event) => onConfigure({ password: event.target.value })} />}
        {canRetry && (
          <Button type="button" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
          Quitar
        </Button>
      </ItemActions>
      {item.status === "configuring" && (
        <ItemFooter>
          <Text size="xs" tone="muted">
            Al elegir banco y cuenta, el estado se empieza a leer solo.
          </Text>
        </ItemFooter>
      )}
    </Item>
  );
}
