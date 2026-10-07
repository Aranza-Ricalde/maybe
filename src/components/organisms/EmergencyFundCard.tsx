import type { EmergencyFundView } from "@/application/getEmergencyFund";
import { Text } from "@/components/atoms/Text";
import { StatBlock } from "@/components/molecules/StatBlock";
import { StatBlockRow } from "@/components/molecules/StatBlockRow";
import { formatPesos } from "@/lib/format";

export function EmergencyFundCard({ emergencyFund }: { emergencyFund: EmergencyFundView }) {
  const target = emergencyFund.targetMonths;

  return (
    <StatBlockRow>
      <StatBlock
        label="Fondo de emergencia"
        value={emergencyFund.coverageMonths == null ? "—" : `${emergencyFund.coverageMonths.toFixed(1)} meses`}
        tooltip={
          emergencyFund.source === "goal"
            ? "Las cuentas de tu meta de fondo de emergencia entre tu gasto esencial mensual (las categorías que marcaste como esenciales)."
            : "Tus cuentas de ahorro entre tu gasto esencial mensual (las categorías que marcaste como esenciales)."
        }
        hint={
          <div className="mt-1 flex flex-col gap-0.5">
            {emergencyFund.coverageMonths == null ? (
              <Text size="xs" tone="muted">
                Marca tus categorías esenciales en Configuración para calcularlo
              </Text>
            ) : (
              <>
                <Text size="xs" tone={emergencyFund.missingCents === 0 ? "success" : "muted"}>
                  {emergencyFund.source === "goal" ? "Tu meta" : "Meta sugerida"}: {Number.isInteger(target) ? target : target.toFixed(1)} meses · {emergencyFund.missingCents === 0 ? "meta cumplida" : `faltan ${formatPesos(emergencyFund.missingCents as number)}`}
                </Text>
                <Text size="xs" tone="muted">
                  {formatPesos(emergencyFund.fundCents)} ahorrados · {formatPesos(emergencyFund.essentialMonthlyCents as number)} de gasto esencial al mes
                </Text>
              </>
            )}
          </div>
        }
      />
    </StatBlockRow>
  );
}
