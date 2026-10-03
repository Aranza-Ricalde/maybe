import { ChevronLeft, ChevronRight } from "@gravity-ui/icons";
import Link from "next/link";
import { Icon } from "@/components/atoms/Icon";
import { Text } from "@/components/atoms/Text";
import { formatMonthYear } from "@/lib/format";

export interface MonthNavProps {
  month: string;
  prevMonth: string;
  nextMonth: string;
  basePath: string;
}

export function MonthNav({ month, prevMonth, nextMonth, basePath }: MonthNavProps) {
  const label = formatMonthYear(month);

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`${basePath}?month=${prevMonth}`}
        aria-label="Mes anterior"
        className="flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
      >
        <Icon icon={ChevronLeft} />
      </Link>
      <Text weight="medium" className="w-36 text-center capitalize">
        {label}
      </Text>
      <Link
        href={`${basePath}?month=${nextMonth}`}
        aria-label="Mes siguiente"
        className="flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
      >
        <Icon icon={ChevronRight} />
      </Link>
    </div>
  );
}
