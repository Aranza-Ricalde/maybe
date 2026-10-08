import type { FormAction } from "@/lib/actionResult";
import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Text } from "@/components/atoms/Text";
import { DetailModal } from "@/components/molecules/DetailModal";
import { RestoreAccountButton } from "@/components/molecules/RestoreAccountButton";
import type { AccountType } from "@/domain/accounts/rules";
import { ACCOUNT_TYPE_LABELS } from "@/lib/format";

export interface ArchivedAccountInput {
  id: number;
  name: string;
  type: AccountType;
}

export interface ArchivedAccountsModalProps {
  accounts: ArchivedAccountInput[];
  restoreAccountAction: FormAction;
}

export function ArchivedAccountsModal({ accounts, restoreAccountAction }: ArchivedAccountsModalProps) {
  if (accounts.length === 0) return null;

  return (
    <DetailModal title="Cuentas archivadas" triggerLabel={`Ver cuentas archivadas (${accounts.length})`}>
      <Alert variant="info">
        <Info />
        <AlertTitle>Se archivaron, no se borraron</AlertTitle>
        <AlertDescription>Estas cuentas ya tenían movimientos registrados, así que su historial sigue intacto. Reactívalas para que vuelvan a aparecer en Cuentas.</AlertDescription>
      </Alert>
      <ul className="flex flex-col divide-y divide-border">
        {accounts.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
            <div>
              <Text weight="medium">{a.name}</Text>
              <Text size="xs" tone="muted">
                {ACCOUNT_TYPE_LABELS[a.type]}
              </Text>
            </div>
            <RestoreAccountButton accountId={a.id} restoreAccountAction={restoreAccountAction} />
          </li>
        ))}
      </ul>
    </DetailModal>
  );
}
