"use client";

import type { ReactElement, ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export type ResponsiveDialogSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<ResponsiveDialogSize, string> = { sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-lg", xl: "sm:max-w-3xl" };

export interface ResponsiveDialogProps {
  title: string;
  description?: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: ResponsiveDialogSize;
  hideClose?: boolean;
  children: ReactNode;
}

export function ResponsiveDialog({ title, description, trigger, open, onOpenChange, size = "lg", hideClose = false, children }: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {trigger && <DrawerTrigger render={trigger as ReactElement} />}
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription className={description ? undefined : "sr-only"}>{description ?? title}</DrawerDescription>
          </DrawerHeader>
          <div className="flex max-h-[70dvh] flex-col gap-4 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger as ReactElement} />}
      <DialogContent showCloseButton={!hideClose} className={cn("max-h-[90dvh] overflow-x-hidden overflow-y-auto", SIZE_CLASS[size])}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className={description ? undefined : "sr-only"}>{description ?? title}</DialogDescription>
        </DialogHeader>
        <div className="flex min-w-0 flex-col gap-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
