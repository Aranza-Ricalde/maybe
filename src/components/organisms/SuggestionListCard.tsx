import { Button, Card } from "@heroui/react";
import { Text } from "@/components/atoms/Text";
import { FIELD } from "@/lib/formFields";

export interface SuggestionItem {
  id: number;
  title: string;
  detail: string;
}

export interface SuggestionListCardProps {
  title: string;
  description: string;
  items: SuggestionItem[];
  confirmAction: (formData: FormData) => Promise<void> | void;
  dismissAction: (formData: FormData) => Promise<void> | void;
}

function DecisionForm({ id, action, variant, label }: { id: number; action: SuggestionListCardProps["confirmAction"]; variant: "primary" | "ghost"; label: string }) {
  return (
    <form action={action}>
      <input type="hidden" name={FIELD.id} value={id} />
      <Button type="submit" size="sm" variant={variant}>
        {label}
      </Button>
    </form>
  );
}

export function SuggestionListCard({ title, description, items, confirmAction, dismissAction }: SuggestionListCardProps) {
  if (items.length === 0) return null;

  return (
    <Card className="p-5">
      <Card.Header>
        <Card.Title>{title}</Card.Title>
        <Card.Description>{description}</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-separator p-3">
            <div>
              <p className="text-sm font-medium">{item.title}</p>
              <Text size="xs" tone="muted">
                {item.detail}
              </Text>
            </div>
            <div className="flex gap-2">
              <DecisionForm id={item.id} action={confirmAction} variant="primary" label="Confirmar" />
              <DecisionForm id={item.id} action={dismissAction} variant="ghost" label="Ignorar" />
            </div>
          </div>
        ))}
      </Card.Content>
    </Card>
  );
}
