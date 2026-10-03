import { CircleInfo } from "@gravity-ui/icons";
import { Button, Tooltip } from "@heroui/react";
import { Icon } from "@/components/atoms/Icon";

export function InfoTooltip({ label }: { label: string }) {
  return (
    <Tooltip delay={0}>
      <Button isIconOnly aria-label="¿Cómo se calcula esto?" variant="ghost" size="sm">
        <Icon icon={CircleInfo} />
      </Button>
      <Tooltip.Content className="max-w-56 break-normal p-3 text-left text-xs leading-relaxed">{label}</Tooltip.Content>
    </Tooltip>
  );
}
