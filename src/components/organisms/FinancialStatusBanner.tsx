import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { FinancialStatusLevel, FinancialStatusResult } from "@/domain/dashboard/rules";

const ALERT_BY_LEVEL = {
  green: { variant: "success", Icon: CircleCheck },
  yellow: { variant: "warning", Icon: TriangleAlert },
  red: { variant: "destructive", Icon: CircleAlert },
} as const satisfies Record<FinancialStatusLevel, { variant: string; Icon: unknown }>;

export function FinancialStatusBanner({ status }: { status: FinancialStatusResult }) {
  const { variant, Icon } = ALERT_BY_LEVEL[status.level];
  return (
    <Alert variant={variant}>
      <Icon />
      <AlertTitle>{status.message}</AlertTitle>
      <AlertDescription>{status.detail}</AlertDescription>
    </Alert>
  );
}
