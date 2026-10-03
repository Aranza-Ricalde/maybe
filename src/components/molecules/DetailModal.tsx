"use client";

import { Modal } from "@heroui/react";
import type { ReactNode } from "react";

export interface DetailModalProps {
  title: string;
  triggerLabel?: string;
  trigger?: ReactNode;
  triggerClassName?: string;
  children: ReactNode;
}

export function DetailModal({ title, triggerLabel = "Ver detalle →", trigger, triggerClassName, children }: DetailModalProps) {
  return (
    <Modal.Root>
      <Modal.Trigger className={triggerClassName ?? "text-xs text-accent hover:underline"}>{trigger ?? triggerLabel}</Modal.Trigger>
      <Modal.Backdrop>
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{title}</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-5">{children}</Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
