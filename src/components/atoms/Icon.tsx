import type { ComponentType, SVGProps } from "react";

export type IconSize = "xs" | "sm" | "md" | "lg";

const ICON_SIZE_CLASS: Record<IconSize, string> = {
  xs: "size-2.5",
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

export interface IconProps extends SVGProps<SVGSVGElement> {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  size?: IconSize;
}

export function Icon({ icon: IconComponent, size = "md", className = "", ...props }: IconProps) {
  return <IconComponent className={`${ICON_SIZE_CLASS[size]} ${className}`.trim()} {...props} />;
}
