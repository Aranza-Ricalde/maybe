import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { CONFIRMABLE_TRANSFER_KINDS, TRANSFER_KIND_SHORT_LABELS } from "@/domain/transfers/rules";

export function TransferKindSelect({ defaultValue = "transfer", name = "kind" }: { defaultValue?: string; name?: string }) {
  return (
    <NativeSelect size="sm" name={name} defaultValue={defaultValue} aria-label="Tipo de movimiento">
      {CONFIRMABLE_TRANSFER_KINDS.map((kind) => (
        <NativeSelectOption key={kind} value={kind}>
          {TRANSFER_KIND_SHORT_LABELS[kind]}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
