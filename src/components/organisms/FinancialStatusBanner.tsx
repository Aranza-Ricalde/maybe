import { Alert } from "@heroui/react";
import { STATUS_THEME } from "@/components/molecules/StatusTheme";
import type { FinancialStatusLevel, FinancialStatusResult } from "@/domain/dashboard/rules";

const ALERT_STATUS: Record<FinancialStatusLevel, "success" | "warning" | "danger"> = {
  green: "success",
  yellow: "warning",
  red: "danger",
};

export function FinancialStatusBanner({ status }: { status: FinancialStatusResult }) {
  const theme = STATUS_THEME[status.level];

  return (
    <Alert status={ALERT_STATUS[status.level]} className={`gap-3 border py-2.5 ${theme.banner}`}>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{status.message}</Alert.Title>
        <Alert.Description>{status.detail}</Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
