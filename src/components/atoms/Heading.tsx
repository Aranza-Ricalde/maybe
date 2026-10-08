import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type HeadingTone = "default" | "muted";
export type HeadingLevel = 1 | 2 | 3 | 4;

const TONE_CLASS: Record<HeadingTone, string> = { default: "text-foreground", muted: "text-muted-foreground" };
const LEVEL_CLASS: Record<HeadingLevel, string> = { 1: "text-2xl font-semibold", 2: "text-xl font-semibold", 3: "text-lg font-semibold", 4: "text-base font-semibold" };

export interface HeadingProps extends Omit<ComponentProps<"h1">, "color"> {
  tone?: HeadingTone;
  level?: HeadingLevel;
}

export function Heading({ tone = "default", level = 2, className, ...props }: HeadingProps) {
  const Tag = `h${level}` as const;
  return <Tag className={cn(LEVEL_CLASS[level], TONE_CLASS[tone], className)} {...props} />;
}
