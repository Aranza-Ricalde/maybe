import { ActionForm } from "@/components/molecules/ActionForm";
import type { FormAction } from "@/lib/actionResult";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemSeparator, ItemTitle } from "@/components/ui/item";
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
  confirmAction: FormAction;
  dismissAction: FormAction;
}

function DecisionForm({ id, action, variant, label }: { id: number; action: SuggestionListCardProps["confirmAction"]; variant: "default" | "ghost"; label: string }) {
  return (
    <ActionForm action={action}>
      <input type="hidden" name={FIELD.id} value={id} />
      <Button type="submit" size="sm" variant={variant}>
        {label}
      </Button>
    </ActionForm>
  );
}

export function SuggestionListCard({ title, description, items, confirmAction, dismissAction }: SuggestionListCardProps) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {items.map((item, index) => (
            <Fragment key={item.id}>
              {index > 0 && <ItemSeparator />}
              <Item size="sm" className="px-0">
                <ItemContent>
                  <ItemTitle>{item.title}</ItemTitle>
                  <ItemDescription>{item.detail}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <DecisionForm id={item.id} action={confirmAction} variant="default" label="Confirmar" />
                  <DecisionForm id={item.id} action={dismissAction} variant="ghost" label="Ignorar" />
                </ItemActions>
              </Item>
            </Fragment>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
