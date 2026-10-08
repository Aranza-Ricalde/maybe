import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

export type StatusLevel = "green" | "yellow" | "red";

export const STATUS_THEME: Record<StatusLevel, { banner: string; border: string }> = {
  green: { banner: "border-success/15 bg-success/8", border: "border-l-success" },
  yellow: { banner: "border-warning/15 bg-warning/8", border: "border-l-warning" },
  red: { banner: "border-danger/15 bg-danger/8", border: "border-l-danger" },
};

export const STATUS_LEVEL_TO_BADGE_VARIANT: Record<StatusLevel, NonNullable<VariantProps<typeof badgeVariants>["variant"]>> = {
  green: "success",
  yellow: "warning",
  red: "destructive",
};
