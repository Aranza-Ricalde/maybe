"use client";

import type { FormAction } from "@/lib/actionResult";
import { ArrowLeftRight } from "lucide-react";
import { TransferKindSelect } from "@/components/molecules/TransferKindSelect";
import { FormModal } from "./FormModal";
import { FIELD } from "@/lib/formFields";

export interface MarkTransferModalProps {
  transactionId: number;
  name: string;
  detail?: string;
  action: FormAction;
}

export function MarkTransferModal({ transactionId, name, detail, action }: MarkTransferModalProps) {
  return (
    <FormModal
      title="¿Qué es este movimiento?"
      iconTrigger={{ icon: ArrowLeftRight, label: `Marcar ${name} como transferencia o pago` }}
      submitLabel="Confirmar"
      size="sm"
      action={action}
    >
      <input type="hidden" name={FIELD.transactionId} value={transactionId} />
      <div>
        <p className="text-sm font-semibold">{name}</p>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      </div>
      <TransferKindSelect />
      <p className="text-xs text-muted-foreground">
        Deja de contarse como gasto o ingreso. Tus saldos no cambian y lo puedes deshacer desde el mismo movimiento.
      </p>
    </FormModal>
  );
}
