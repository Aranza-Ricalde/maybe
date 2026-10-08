"use client";

import type { FormAction } from "@/lib/actionResult";
import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Icon, type IconProps } from "@/components/atoms/Icon";
import { Text } from "@/components/atoms/Text";
import { ResponsiveDialog } from "@/components/molecules/ResponsiveDialog";
import { useFormModalController } from "@/hooks/useFormModalController";

export type IconTriggerTone = "neutral" | "danger";

export interface IconTrigger {
  icon: IconProps["icon"];
  label: string;
  tone?: IconTriggerTone;
}

const ICON_TRIGGER_TONE: Record<IconTriggerTone, string> = {
  neutral: "text-muted-foreground",
  danger: "text-muted-foreground hover:text-destructive",
};

export interface FormModalProps {
  title: string;
  trigger?: ReactNode;
  iconTrigger?: IconTrigger;
  triggerVariant?: "default" | "ghost" | "outline";
  triggerClassName?: string;
  submitLabel: string;
  submitVariant?: "default" | "destructive";
  pendingLabel?: string;
  size?: "sm" | "md" | "lg";
  action: FormAction;
  children: ReactNode;
}

export function FormModal({
  title,
  trigger,
  iconTrigger,
  triggerVariant = "default",
  triggerClassName,
  submitLabel,
  submitVariant = "default",
  pendingLabel = "Guardando…",
  size = "lg",
  action,
  children,
}: FormModalProps) {
  const { isOpen, setIsOpen, isPending, handleSubmit } = useFormModalController({ action });

  const triggerButton = iconTrigger ? (
    <Button type="button" variant="ghost" size="icon-sm" aria-label={iconTrigger.label} className={ICON_TRIGGER_TONE[iconTrigger.tone ?? "neutral"]}>
      <Icon icon={iconTrigger.icon} />
    </Button>
  ) : (
    <Button type="button" variant={triggerVariant} className={triggerClassName}>
      {trigger}
    </Button>
  );

  return (
    <ResponsiveDialog title={title} size={size} open={isOpen} onOpenChange={(open) => !isPending && setIsOpen(open)} trigger={triggerButton} hideClose={isPending}>
      {isPending ? (
        <div className="flex flex-col items-center justify-center gap-2 py-6">
          <Spinner className="size-6 text-primary" />
          <Text tone="muted">{pendingLabel}</Text>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {children}
          <Button type="submit" variant={submitVariant}>
            {submitLabel}
          </Button>
        </form>
      )}
    </ResponsiveDialog>
  );
}
