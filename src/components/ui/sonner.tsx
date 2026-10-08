"use client"

import { useThemePreference } from "@/hooks/useThemePreference"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { preference } = useThemePreference()

  return (
    <Sonner
      theme={preference}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "color-mix(in oklab, var(--success) 14%, var(--popover))",
          "--success-text": "var(--success)",
          "--success-border": "color-mix(in oklab, var(--success) 40%, transparent)",
          "--error-bg": "color-mix(in oklab, var(--danger) 14%, var(--popover))",
          "--error-text": "var(--danger)",
          "--error-border": "color-mix(in oklab, var(--danger) 40%, transparent)",
          "--warning-bg": "color-mix(in oklab, var(--warning) 14%, var(--popover))",
          "--warning-text": "var(--warning)",
          "--warning-border": "color-mix(in oklab, var(--warning) 40%, transparent)",
          "--info-bg": "color-mix(in oklab, var(--primary) 12%, var(--popover))",
          "--info-text": "var(--primary)",
          "--info-border": "color-mix(in oklab, var(--primary) 40%, transparent)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
