import { Button, Card } from "@heroui/react";
import type { getPendingConceptSuggestions } from "@/app/lib/queries";
import { Text } from "@/components/atoms/Text";
import { formatCurrency } from "@/lib/format";

type ConceptSuggestion = Awaited<ReturnType<typeof getPendingConceptSuggestions>>[number];

export function ConceptSuggestionsCard({
  suggestions,
  confirmAction,
  rejectAction,
}: {
  suggestions: ConceptSuggestion[];
  confirmAction: (formData: FormData) => void;
  rejectAction: (formData: FormData) => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <Card className="p-5">
      <Card.Header>
        <Card.Title>Posibles coincidencias</Card.Title>
        <Card.Description>Creemos que estos movimientos corresponden a un concepto que ya conoces — confirma o ignora.</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        {suggestions.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border border-separator p-3">
            <div>
              <p className="text-sm font-medium">{s.transactionName}</p>
              <Text size="xs" tone="muted">
                {formatCurrency(s.transactionAmountCents)} el {s.transactionDate} — ¿Es {s.conceptName}?
              </Text>
            </div>
            <div className="flex gap-2">
              <form action={confirmAction}>
                <input type="hidden" name="id" value={s.id} />
                <Button type="submit" size="sm" variant="primary">
                  Confirmar
                </Button>
              </form>
              <form action={rejectAction}>
                <input type="hidden" name="id" value={s.id} />
                <Button type="submit" size="sm" variant="ghost">
                  Ignorar
                </Button>
              </form>
            </div>
          </div>
        ))}
      </Card.Content>
    </Card>
  );
}
