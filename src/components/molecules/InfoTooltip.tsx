import { Info } from "lucide-react";
import { Icon } from "@/components/atoms/Icon";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface InfoTooltipProps {
  label: string;
  ariaLabel?: string;
}

export function InfoTooltip({ label, ariaLabel = "¿Cómo se calcula esto?" }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" aria-label={ariaLabel} variant="ghost" size="icon-sm">
          <Icon icon={Info} />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-left leading-relaxed">{label}</TooltipContent>
    </Tooltip>
  );
}
