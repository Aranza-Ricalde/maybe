import { Chip as HeroChip } from "@heroui/react";
import type { ComponentProps } from "react";

export type ChipTone = "default" | "muted" | "success" | "warning" | "danger" | "accent";

const TONE_TO_COLOR: Record<ChipTone, ComponentProps<typeof HeroChip>["color"]> = {
  default: "default",
  muted: "default",
  success: "success",
  warning: "warning",
  danger: "danger",
  accent: "accent",
};

export interface ChipProps extends Omit<ComponentProps<typeof HeroChip>, "color"> {
  tone?: ChipTone;
}

export function Chip({ tone = "default", variant = "soft", size = "sm", className = "", ...props }: ChipProps) {
  const mutedClass = tone === "muted" ? "text-muted!" : "";
  return <HeroChip color={TONE_TO_COLOR[tone]} variant={variant} size={size} className={`${mutedClass} ${className}`.trim()} {...props} />;
}
