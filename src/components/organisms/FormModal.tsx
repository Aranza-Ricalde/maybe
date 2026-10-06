"use client";

import { Modal, Spinner } from "@heroui/react";
import type { ReactNode } from "react";
import { Button } from "@/components/atoms/Button";
import { Icon, type IconProps } from "@/components/atoms/Icon";
import { Text } from "@/components/atoms/Text";
import { useFormModalController } from "@/hooks/useFormModalController";

export type IconTriggerTone = "neutral" | "danger";

export interface IconTrigger {
  icon: IconProps["icon"];
  label: string;
  tone?: IconTriggerTone;
}

const ICON_TRIGGER_BASE = "inline-flex! size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary";
const ICON_TRIGGER_TONE: Record<IconTriggerTone, string> = {
  neutral: `${ICON_TRIGGER_BASE} hover:text-foreground`,
  danger: `${ICON_TRIGGER_BASE} hover:text-danger`,
};

export interface FormModalProps {
  title: string;
  trigger?: ReactNode;
  iconTrigger?: IconTrigger;
  triggerVariant?: "primary" | "ghost";
  triggerClassName?: string;
  submitLabel: string;
  submitVariant?: "primary" | "danger";
  pendingLabel?: string;
  size?: "sm" | "md" | "lg";
  action: (formData: FormData) => Promise<void> | void;
  children: ReactNode;
}

export function FormModal({
  title,
  trigger,
  iconTrigger,
  triggerVariant = "primary",
  triggerClassName,
  submitLabel,
  submitVariant = "primary",
  pendingLabel = "Guardando…",
  size = "lg",
  action,
  children,
}: FormModalProps) {
  const { isOpen, setIsOpen, isPending, handleSubmit } = useFormModalController({ action });

  return (
    <>
      {iconTrigger ? (
        <Button type="button" variant="ghost" isIconOnly aria-label={iconTrigger.label} className={ICON_TRIGGER_TONE[iconTrigger.tone ?? "neutral"]} onPress={() => setIsOpen(true)}>
          <Icon icon={iconTrigger.icon} />
        </Button>
      ) : (
        <Button type="button" variant={triggerVariant} className={triggerClassName} onPress={() => setIsOpen(true)}>
          {trigger}
        </Button>
      )}
      <Modal.Root isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop>
          <Modal.Container size={size}>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>{title}</Modal.Heading>
                <Modal.CloseTrigger isDisabled={isPending} />
              </Modal.Header>
              <Modal.Body>
                {isPending ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-6">
                    <Spinner size="md" />
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
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal.Root>
    </>
  );
}
