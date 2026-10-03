import { Alert } from "@heroui/react";
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
  restoreAccountAction: (formData: FormData) => Promise<void> | void;
}

export function ArchivedAccountsModal({ accounts, restoreAccountAction }: ArchivedAccountsModalProps) {
  if (accounts.length === 0) return null;

  return (
    <DetailModal title="Cuentas archivadas" triggerLabel={`Ver cuentas archivadas (${accounts.length})`}>
      <Alert status="accent">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Se archivaron, no se borraron</Alert.Title>
          <Alert.Description>
            Estas cuentas ya tenían movimientos registrados, así que su historial sigue intacto. Reactívalas para que vuelvan a aparecer en
            Cuentas.
          </Alert.Description>
        </Alert.Content>
      </Alert>
      <ul className="flex flex-col divide-y divide-separator">
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
