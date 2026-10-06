"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
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
    <section aria-label={ariaLabel} className="rounded-xl border border-l-[3px] border-separator border-l-warning bg-surface px-4 py-3">
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
              <Button isIconOnly size="sm" variant="ghost" aria-label="Anterior" onPress={() => position.onGo(-1)}>
                <Icon icon={ChevronLeft} />
              </Button>
              <span className="min-w-10 text-center text-xs tabular-nums text-muted">
                {position.current + 1}/{position.total}
              </span>
              <Button isIconOnly size="sm" variant="ghost" aria-label="Siguiente" onPress={() => position.onGo(1)}>
                <Icon icon={ChevronRight} />
              </Button>
            </>
          )}
          {details && (
            <Button isIconOnly size="sm" variant="ghost" aria-label={showDetails ? "Ocultar detalles" : "Ver detalles"} aria-expanded={showDetails} onPress={() => setShowDetails((v) => !v)}>
              <Icon icon={showDetails ? ChevronUp : ChevronDown} />
            </Button>
          )}
        </div>
      </div>

      {details && showDetails && <div className="mt-3 space-y-1 border-t border-separator pt-3 text-xs text-muted">{details}</div>}
    </section>
  );
}
