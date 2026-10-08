import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type TextTone = "default" | "muted" | "success" | "warning" | "danger" | "accent";
export type TextSize = "xs" | "sm" | "base";
export type TextWeight = "normal" | "medium" | "semibold";

const TONE_CLASS: Record<TextTone, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  accent: "text-primary",
};
const SIZE_CLASS: Record<TextSize, string> = { xs: "text-xs", sm: "text-sm", base: "text-base" };
const WEIGHT_CLASS: Record<TextWeight, string> = { normal: "font-normal", medium: "font-medium", semibold: "font-semibold" };

export interface TextProps extends ComponentProps<"p"> {
  tone?: TextTone;
  size?: TextSize;
  weight?: TextWeight;
}

export function Text({ tone = "default", size = "sm", weight = "normal", className, ...props }: TextProps) {
  return <p className={cn(SIZE_CLASS[size], WEIGHT_CLASS[weight], TONE_CLASS[tone], className)} {...props} />;
}
