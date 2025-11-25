"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const liquidbuttonVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
  {
    variants: {
      size: {
        default: "h-11 px-8",
        lg: "h-12 px-10",
        xl: "h-14 px-12 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
)

type LiquidButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof liquidbuttonVariants> & {
    asChild?: boolean
  }

export function LiquidButton({ className, size, asChild = false, children, ...props }: LiquidButtonProps) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp className={cn("group overflow-hidden", liquidbuttonVariants({ size, className }))} {...props}>
      <span className="absolute inset-0 rounded-full bg-black/50" />
      <span className="absolute inset-[1px] rounded-full bg-gradient-to-b from-[#1f1f27] via-[#101016] to-[#0b0b10]" />
      <span className="absolute inset-0 rounded-full border border-white/5" />
      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#7dd3fc]/30 via-transparent to-[#c084fc]/30 opacity-0 transition duration-500 group-hover:opacity-100" />
      <span className="relative flex items-center gap-2 text-sm font-semibold text-white tracking-wide">
        {children}
      </span>
    </Comp>
  )
}

