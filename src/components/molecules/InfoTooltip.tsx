import { CircleInfo } from "@gravity-ui/icons";
import { Button, Tooltip } from "@heroui/react";
import { Icon } from "@/components/atoms/Icon";

export interface InfoTooltipProps {
  label: string;
  ariaLabel?: string;
}

export function InfoTooltip({ label, ariaLabel = "¿Cómo se calcula esto?" }: InfoTooltipProps) {
  return (
    <Tooltip delay={0}>
      <Button isIconOnly aria-label={ariaLabel} variant="ghost" size="sm">
        <Icon icon={CircleInfo} />
      </Button>
      <Tooltip.Content className="max-w-64 break-normal p-3 text-left text-xs leading-relaxed">{label}</Tooltip.Content>
    </Tooltip>
  );
}
