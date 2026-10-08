import { ActionForm } from "@/components/molecules/ActionForm";
import type { FormAction } from "@/lib/actionResult";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Text } from "@/components/atoms/Text";
import { PendingSubmitButton } from "@/components/molecules/PendingSubmitButton";
import { ProgressListRow } from "@/components/molecules/ProgressListRow";
import { MAX_SUBSCRIPTION_GROUP_NAME_LENGTH, type SubscriptionSummary } from "@/domain/spendingAnalysis/subscriptions";
import { formatPesos } from "@/lib/format";
import { FIELD } from "@/lib/formFields";

const MERGE_FORM_ID = "merge-subscriptions-form";

export interface SubscriptionsCardProps {
  subscriptions: SubscriptionSummary;
  mergeAction: FormAction;
  dissolveAction: FormAction;
}

export function SubscriptionsCard({ subscriptions, mergeAction, dissolveAction }: SubscriptionsCardProps) {
  const { services, suggestions, windowMonths, monthlyCents, yearlyCents } = subscriptions;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tus suscripciones</CardTitle>
        <CardDescription>
          {formatPesos(monthlyCents)} al mes, {formatPesos(yearlyCents)} al año. Cada servicio cuenta su cobro mensual típico (el cobro de en medio de los últimos {windowMonths} meses), no un promedio repartido.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {suggestions.length > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border border-warning/40 p-3">
            <Text weight="medium">¿Son la misma suscripción?</Text>
            {suggestions.map((suggestion) => (
              <ActionForm key={suggestion.members.join("|")} action={mergeAction} className="flex flex-wrap items-center justify-between gap-3">
                <Text size="xs" tone="muted">
                  «{suggestion.names[0]}» y «{suggestion.names[1]}»: {formatPesos(suggestion.amountCents)}, nunca en el mismo mes.
                </Text>
                {suggestion.members.map((member) => (
                  <input key={member} type="hidden" name={FIELD.members} value={member} />
                ))}
                <input type="hidden" name={FIELD.name} value={suggestion.names[0]} />
                <PendingSubmitButton>Sí, fusionar</PendingSubmitButton>
              </ActionForm>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {services.map((service) => (
            <div key={service.key} className="flex items-start gap-3">
              <Checkbox form={MERGE_FORM_ID} name={FIELD.members} value={service.members[0]} aria-label={`Elegir ${service.name} para fusionar`} className="mt-1" />
              <div className="min-w-0 flex-1">
                <ProgressListRow label={service.name} value={`${formatPesos(service.monthlyCents)} /mes`} percent={monthlyCents > 0 ? service.monthlyCents / monthlyCents : 0} />
                <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                  <span>
                    {service.chargeCount} {service.chargeCount === 1 ? "cobro" : "cobros"} en {service.monthsWithCharge} de {windowMonths} meses
                  </span>
                  {service.members.length > 1 && <span>Incluye: {service.members.join(", ")}</span>}
                  {service.groupId != null && (
                    <ActionForm action={dissolveAction}>
                      <input type="hidden" name={FIELD.id} value={service.groupId} />
                      <PendingSubmitButton variant="ghost" label={`Deshacer la fusión de ${service.name}`}>
                        Deshacer fusión
                      </PendingSubmitButton>
                    </ActionForm>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <ActionForm id={MERGE_FORM_ID} action={mergeAction} className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <input
            name={FIELD.name}
            required
            maxLength={MAX_SUBSCRIPTION_GROUP_NAME_LENGTH}
            placeholder="Nombre de la suscripción fusionada"
            aria-label="Nombre de la suscripción fusionada"
            className="h-8 min-w-60 flex-1 rounded-lg border border-border bg-card px-2 text-sm text-foreground focus:outline-2 focus:outline-primary"
          />
          <PendingSubmitButton>Fusionar las elegidas</PendingSubmitButton>
          <Text size="xs" tone="muted" className="basis-full">
            Elige dos o más servicios que en realidad son uno; la app recordará la regla para los cobros futuros.
          </Text>
        </ActionForm>
      </CardContent>
    </Card>
  );
}
