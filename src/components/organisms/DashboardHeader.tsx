import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Text } from "@/components/atoms/Text";
import { PageHeader } from "@/components/molecules/PageHeader";
import { PeriodMultiSelect, type PeriodMultiSelectOption } from "@/components/molecules/PeriodMultiSelect";
import { greetingForHour } from "@/lib/greeting";
import { currentHour } from "@/lib/today";
import { ROUTES } from "@/domain/shared/routes";

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
        title={`${greetingForHour(currentHour())}, ${userName}`}
        action={
          <Link href={ROUTES.transactions}>
            <Button type="button" >+ Registrar movimiento</Button>
          </Link>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <Text weight="medium" className="capitalize">
          {periodLabel}
        </Text>
        <PeriodMultiSelect periods={periods} selectedIds={selectedIds} basePath={ROUTES.dashboard} />
      </div>
    </div>
  );
}
