"use client";

import { ArrowRightArrowLeft } from "@gravity-ui/icons";
import { TransferKindSelect } from "@/components/molecules/TransferKindSelect";
import { FormModal } from "./FormModal";
import { FIELD } from "@/lib/formFields";

export interface MarkTransferModalProps {
  transactionId: number;
  name: string;
  detail?: string;
  action: (formData: FormData) => Promise<void> | void;
}

export function MarkTransferModal({ transactionId, name, detail, action }: MarkTransferModalProps) {
  return (
    <FormModal
      title="¿Qué es este movimiento?"
      iconTrigger={{ icon: ArrowRightArrowLeft, label: `Marcar ${name} como transferencia o pago` }}
      submitLabel="Confirmar"
      size="sm"
      action={action}
    >
      <input type="hidden" name={FIELD.transactionId} value={transactionId} />
      <div>
        <p className="text-sm font-semibold">{name}</p>
        {detail && <p className="text-xs text-muted">{detail}</p>}
      </div>
      <TransferKindSelect />
      <p className="text-xs text-muted">
        Deja de contarse como gasto o ingreso. Tus saldos no cambian y lo puedes deshacer desde el mismo movimiento.
      </p>
    </FormModal>
  );
}
