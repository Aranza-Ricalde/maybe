"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { Icon } from "@/components/atoms/Icon";

export interface ReviewAlertProps {
  ariaLabel: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  itemKey: string | number;
  position: { current: number; total: number; onGo: (delta: number) => void };
  children: ReactNode;
  actions: ReactNode;
  details?: ReactNode;
}

export function ReviewAlert({ ariaLabel, icon, itemKey, position, children, actions, details }: ReviewAlertProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card role="region" aria-label={ariaLabel} className="border-l-4 border-l-warning">
      <CardContent>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex min-w-0 flex-1 basis-80 items-start gap-3">
          <span className="mt-0.5 shrink-0 text-warning">
            <Icon icon={icon} size="lg" />
          </span>
          <div key={itemKey} className="animate-in fade-in-0 min-w-0 flex-1 duration-200" aria-live="polite">
            {children}
          </div>
        </div>

        {actions}

        <div className="flex items-center gap-0.5">
          {position.total > 1 && (
            <>
              <Button type="button" size="icon-sm" variant="ghost" aria-label="Anterior" onClick={() => position.onGo(-1)}>
                <Icon icon={ChevronLeft} />
              </Button>
              <span className="min-w-10 text-center text-xs tabular-nums text-muted-foreground">
                {position.current + 1}/{position.total}
              </span>
              <Button type="button" size="icon-sm" variant="ghost" aria-label="Siguiente" onClick={() => position.onGo(1)}>
                <Icon icon={ChevronRight} />
              </Button>
            </>
          )}
          {details && (
            <Button type="button" size="icon-sm" variant="ghost" aria-label={showDetails ? "Ocultar detalles" : "Ver detalles"} aria-expanded={showDetails} onClick={() => setShowDetails((v) => !v)}>
              <Icon icon={showDetails ? ChevronUp : ChevronDown} />
            </Button>
          )}
        </div>
      </div>

      {details && showDetails && (
        <>
          <Separator className="my-3" />
          <div className="space-y-1 text-xs text-muted-foreground">{details}</div>
        </>
      )}
      </CardContent>
    </Card>
  );
}
