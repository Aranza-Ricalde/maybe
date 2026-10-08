"use client";

import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function PendingSubmitButton({
  children,
  label,
  variant = "default",
  name,
  value,
}: {
  children: ReactNode;
  label?: string;
  variant?: "default" | "ghost";
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" name={name} value={value} size="sm" variant={variant} disabled={pending} aria-label={label}>
      {pending ? "…" : children}
    </Button>
  );
}
