"use client"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const indicatorVariants = cva("h-full transition-all", {
  variants: {
    variant: {
      default: "bg-primary",
      success: "bg-success",
      warning: "bg-warning",
      destructive: "bg-destructive",
    },
  },
  defaultVariants: { variant: "default" },
})

function Progress({
  className,
  value,
  variant,
  indicatorColor,
  ...props
}: ProgressPrimitive.Root.Props &
  VariantProps<typeof indicatorVariants> & { indicatorColor?: string }) {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn("block h-2 w-full", className)}
      {...props}
    >
      <ProgressPrimitive.Track
        data-slot="progress-track"
        className="relative flex h-full w-full items-center overflow-hidden rounded-full bg-muted"
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={indicatorVariants({ variant })}
          style={indicatorColor ? { background: indicatorColor } : undefined}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
