import { Typography } from "@heroui/react";
import type { ComponentProps } from "react";

export type TextTone = "default" | "muted" | "success" | "warning" | "danger" | "accent";
export type TextSize = "xs" | "sm" | "base";

const EXTENDED_TONE_CLASS: Record<Exclude<TextTone, "default" | "muted">, string> = {
  success: "text-success!",
  warning: "text-warning!",
  danger: "text-danger!",
  accent: "text-accent!",
};

const NATIVE_TONES = new Set<TextTone>(["default", "muted"]);

export interface TextProps extends Omit<ComponentProps<typeof Typography.Paragraph>, "size" | "color"> {
  tone?: TextTone;
  size?: TextSize;
}

export function Text({ tone = "default", size = "sm", className = "", ...props }: TextProps) {
  const isNativeTone = NATIVE_TONES.has(tone);
  const toneClass = isNativeTone ? "" : EXTENDED_TONE_CLASS[tone as Exclude<TextTone, "default" | "muted">];
  return (
    <Typography.Paragraph
      size={size}
      color={isNativeTone ? (tone as "default" | "muted") : "default"}
      className={`${toneClass} ${className}`.trim()}
      {...props}
    />
  );
}
