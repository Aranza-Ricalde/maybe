import { Typography } from "@heroui/react";
import type { ComponentProps } from "react";

export type HeadingTone = "default" | "muted";

export interface HeadingProps extends Omit<ComponentProps<typeof Typography.Heading>, "color"> {
  tone?: HeadingTone;
}

export function Heading({ tone = "default", level = 2, ...props }: HeadingProps) {
  return <Typography.Heading level={level} color={tone} {...props} />;
}
