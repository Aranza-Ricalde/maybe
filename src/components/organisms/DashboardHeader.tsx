import { Button } from "@heroui/react";
import Link from "next/link";
import { Text } from "@/components/atoms/Text";
import { PageHeader } from "@/components/molecules/PageHeader";
import { PeriodMultiSelect, type PeriodMultiSelectOption } from "@/components/molecules/PeriodMultiSelect";
import { greetingForHour } from "@/lib/greeting";

export interface DashboardHeaderProps {
  userName: string;
  periodLabel: string;
  periods: PeriodMultiSelectOption[];
  selectedIds: number[];
}

export function DashboardHeader({ userName, periodLabel, periods, selectedIds }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      <PageHeader
        title={`${greetingForHour(new Date().getHours())}, ${userName}`}
        action={
          <Link href="/transactions">
            <Button variant="primary">+ Registrar movimiento</Button>
          </Link>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <Text weight="medium" className="capitalize">
          {periodLabel}
        </Text>
        <PeriodMultiSelect periods={periods} selectedIds={selectedIds} basePath="/" />
      </div>
    </div>
  );
}
