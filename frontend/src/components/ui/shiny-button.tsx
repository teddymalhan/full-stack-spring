"use client"

import React, { type CSSProperties } from "react"

import { cn } from "@/lib/utils"

export interface ShinyButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  borderRadius?: string
  background?: string
  className?: string
  children?: React.ReactNode
}

export const ShinyButton = React.forwardRef<
  HTMLButtonElement,
  ShinyButtonProps
>(
  (
    {
      borderRadius = "0.5rem",
      background = "rgba(0, 0, 0, 0.4)",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        style={
          {
            "--radius": borderRadius,
            "--bg": background,
          } as CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap",
          "[border-radius:var(--radius)] border border-white/10 px-3 py-1.5 text-xs font-medium",
          "text-foreground [background:var(--bg)]",
          "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}

        {/* Highlight */}
        <div
          className={cn(
            "absolute inset-0 size-full pointer-events-none",
            "[border-radius:var(--radius)] shadow-[inset_0_-8px_10px_#ffffff1f]",
            // transition
            "transform-gpu transition-all duration-300 ease-in-out",
            // on hover
            "group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]",
            // on click
            "group-active:shadow-[inset_0_-10px_10px_#ffffff3f]"
          )}
        />

        {/* backdrop */}
        <div
          className={cn(
            "absolute inset-[0.5px] -z-20 [border-radius:var(--radius)] [background:var(--bg)]"
          )}
        />
      </button>
    )
  }
)

ShinyButton.displayName = "ShinyButton"
