import type { ReactNode } from "react";
import { Heading } from "@/components/atoms/Heading";
import { Text } from "@/components/atoms/Text";
import { NotificationBell } from "@/components/organisms/NotificationBell";

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  subtitleClassName?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, subtitleClassName = "", action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="min-w-0 flex-1 basis-64">
        <div className="flex items-center justify-between gap-3">
          <Heading level={1}>{title}</Heading>
          <NotificationBell className="shrink-0 md:hidden" />
        </div>
        {subtitle && (
          <Text tone="muted" className={`mt-1 ${subtitleClassName}`.trim()}>
            {subtitle}
          </Text>
        )}
      </div>
      {action}
    </div>
  );
}
