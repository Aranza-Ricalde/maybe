import { Button as HeroButton } from "@heroui/react";
import type { ComponentProps } from "react";

export type ButtonProps = ComponentProps<typeof HeroButton>;

export function Button(props: ButtonProps) {
  return <HeroButton {...props} />;
}
