"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Progress as ProgressPrimitive } from "radix-ui"

const progressVariants = cva("size-full flex-1 transition-all", {
  variants: {
    variant: {
      default: "bg-primary",
      success: "bg-success",
      warning: "bg-warning",
      destructive: "bg-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const INDETERMINATE_WIDTH = 33

function Progress({
  className,
  value,
  variant,
  indicatorColor,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & VariantProps<typeof progressVariants> & { indicatorColor?: string }) {
  const isIndeterminate = value === null || value === undefined
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(progressVariants({ variant }), isIndeterminate && "animate-pulse")}
        style={{ ...(indicatorColor ? { backgroundColor: indicatorColor } : {}), transform: `translateX(-${100 - (isIndeterminate ? INDETERMINATE_WIDTH : Math.min(100, Math.max(0, value)))}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
