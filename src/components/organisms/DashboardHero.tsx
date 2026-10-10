import Link from "next/link";
import { Heading } from "@/components/atoms/Heading";
import { Text } from "@/components/atoms/Text";
import { NotificationBell } from "@/components/organisms/NotificationBell";
import { PeriodMultiSelect, type PeriodMultiSelectOption } from "@/components/molecules/PeriodMultiSelect";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/domain/shared/routes";
import { greetingForHour } from "@/lib/greeting";
import { currentHour } from "@/lib/today";

export interface DashboardHeroProps {
  userName: string;
  periodLabel: string;
  periods: PeriodMultiSelectOption[];
  selectedIds: number[];
}

export function DashboardHero({ userName, periodLabel, periods, selectedIds }: DashboardHeroProps) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-4 md:flex-wrap md:items-end">
        <div className="flex flex-col gap-2">
          <Heading level={1}>{`${greetingForHour(currentHour())}, ${userName}`}</Heading>
          <div className="flex flex-wrap items-center gap-3">
            <Text weight="medium" className="capitalize">
              {periodLabel}
            </Text>
            <PeriodMultiSelect periods={periods} selectedIds={selectedIds} basePath={ROUTES.dashboard} />
          </div>
        </div>
        <NotificationBell className="md:hidden" />
        <Button className="max-md:hidden" nativeButton={false} render={<Link href={ROUTES.transactions} />}>
          + Registrar movimiento
        </Button>
      </div>
    </header>
  );
}
