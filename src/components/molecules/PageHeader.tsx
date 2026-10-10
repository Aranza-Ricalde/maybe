import type { ReactNode } from "react";
import { Heading } from "@/components/atoms/Heading";
import { NotificationBell } from "@/components/organisms/NotificationBell";
import { Text } from "@/components/atoms/Text";

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  subtitleClassName?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, subtitleClassName = "", action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <Heading level={1}>
          {title}
        </Heading>
        {subtitle && (
          <Text tone="muted" className={`mt-1 ${subtitleClassName}`.trim()}>
            {subtitle}
          </Text>
        )}
      </div>
      <div className="flex items-center gap-2">
        {action}
        <NotificationBell className="md:hidden" />
      </div>
    </div>
  );
}
