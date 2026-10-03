import { Button, Card } from "@heroui/react";
import { acceptCandidate, dismissCandidate } from "@/app/(app)/recurring/actions";
import type { getPendingRecurringCandidates } from "@/app/lib/queries";
import { Text } from "@/components/atoms/Text";
import { formatCurrency } from "@/lib/format";

type RecurringCandidate = Awaited<ReturnType<typeof getPendingRecurringCandidates>>[number];

export function RecurringCandidatesCard({ candidates }: { candidates: RecurringCandidate[] }) {
  if (candidates.length === 0) return null;

  return (
    <Card className="p-5">
      <Card.Header>
        <Card.Title>Posibles gastos recurrentes</Card.Title>
        <Card.Description>Detectamos un patrón — confirma si quieres que cuente en tu presupuesto cada mes.</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        {candidates.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-separator p-3">
            <div>
              <p className="text-sm font-medium">{c.suggestedName}</p>
              <Text size="xs" tone="muted">
                {formatCurrency(c.suggestedAmountCents)} aprox. / mes
              </Text>
            </div>
            <div className="flex gap-2">
              <form action={acceptCandidate}>
                <input type="hidden" name="id" value={c.id} />
                <Button type="submit" size="sm" variant="primary">
                  Confirmar
                </Button>
              </form>
              <form action={dismissCandidate}>
                <input type="hidden" name="id" value={c.id} />
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
