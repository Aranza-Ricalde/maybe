import { CONFIRMABLE_TRANSFER_KINDS, TRANSFER_KIND_SHORT_LABELS } from "@/domain/transfers/rules";

export function TransferKindSelect({ defaultValue = "transfer", name = "kind" }: { defaultValue?: string; name?: string }) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      aria-label="Tipo de movimiento"
      className="h-8 rounded-lg border border-separator bg-surface px-2 text-xs text-foreground focus:outline-2 focus:outline-accent"
    >
      {CONFIRMABLE_TRANSFER_KINDS.map((kind) => (
        <option key={kind} value={kind}>
          {TRANSFER_KIND_SHORT_LABELS[kind]}
        </option>
      ))}
    </select>
  );
}
