"use client";

import { Button } from "@heroui/react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function PendingSubmitButton({
  children,
  label,
  variant = "primary",
  name,
  value,
}: {
  children: ReactNode;
  label?: string;
  variant?: "primary" | "ghost";
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" name={name} value={value} size="sm" variant={variant} isDisabled={pending} aria-label={label}>
      {pending ? "…" : children}
    </Button>
  );
}
