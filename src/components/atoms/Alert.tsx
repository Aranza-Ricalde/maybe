import { Alert as HeroAlert, CloseButton, Spinner } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

export type AlertStatus = NonNullable<ComponentProps<typeof HeroAlert>["status"]>;

export interface AlertProps {
  status?: AlertStatus;
  title: ReactNode;
  description?: ReactNode;
  isLoading?: boolean;
  action?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  className?: string;
}

export function Alert({ status, title, description, isLoading = false, action, onClose, closeLabel = "Cerrar", className }: AlertProps) {
  return (
    <HeroAlert status={status} className={className}>
      <HeroAlert.Indicator>{isLoading ? <Spinner size="sm" /> : undefined}</HeroAlert.Indicator>
      <HeroAlert.Content>
        <HeroAlert.Title>{title}</HeroAlert.Title>
        {description && <HeroAlert.Description>{description}</HeroAlert.Description>}
        {action && <div className="mt-2">{action}</div>}
      </HeroAlert.Content>
      {onClose && <CloseButton aria-label={closeLabel} onPress={onClose} />}
    </HeroAlert>
  );
}
