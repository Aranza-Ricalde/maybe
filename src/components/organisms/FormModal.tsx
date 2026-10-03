"use client";

import { Modal, Spinner } from "@heroui/react";
import type { ReactNode } from "react";
import { Button } from "@/components/atoms/Button";
import { Text } from "@/components/atoms/Text";
import { useFormModalController } from "@/hooks/useFormModalController";

export interface FormModalProps {
  title: string;
  trigger: ReactNode;
  triggerVariant?: "primary" | "ghost";
  triggerIsIconOnly?: boolean;
  triggerAriaLabel?: string;
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
  triggerVariant = "primary",
  triggerIsIconOnly = false,
  triggerAriaLabel,
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
      <Button
        type="button"
        variant={triggerVariant}
        isIconOnly={triggerIsIconOnly}
        aria-label={triggerAriaLabel}
        className={triggerClassName}
        onPress={() => setIsOpen(true)}
      >
        {trigger}
      </Button>
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
