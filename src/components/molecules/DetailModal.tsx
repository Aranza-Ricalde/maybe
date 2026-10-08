"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "./ResponsiveDialog";

export interface DetailModalProps {
  title: string;
  triggerLabel?: string;
  trigger?: ReactNode;
  triggerClassName?: string;
  children: ReactNode;
}

export function DetailModal({ title, triggerLabel = "Ver detalle →", trigger, triggerClassName, children }: DetailModalProps) {
  return (
    <ResponsiveDialog
      title={title}
      trigger={
        <Button type="button" variant="link" size="sm" className={triggerClassName}>
          {trigger ?? triggerLabel}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">{children}</div>
    </ResponsiveDialog>
  );
}
