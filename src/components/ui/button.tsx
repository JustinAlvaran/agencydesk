"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  `
  inline-flex items-center justify-center 
  whitespace-nowrap font-medium outline-none
  transition-all duration-300 ease-in-out
  shrink-0 cursor-pointer select-none
  focus-visible:ring-[3px] focus-visible:ring-ring/40
  aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40
  aria-invalid:border-destructive disabled:opacity-50 disabled:pointer-events-none
  [&_svg]:pointer-events-none [&_svg]:shrink-0
  [&_svg]:w-[clamp(1rem,1.5vw,1.25rem)] [&_svg]:h-[clamp(1rem,1.5vw,1.25rem)]
  text-[clamp(0.875rem,1.2vw,1rem)] gap-[clamp(0.25rem,1vw,0.5rem)]
  rounded-[clamp(0.375rem,1vw,0.75rem)]
  `,
  {
    variants: {
      variant: {
        default: `
          bg-primary text-white hover:bg-primary/85
          shadow-sm dark:bg-primary dark:hover:bg-primary/90 rounded-full
        `,
        destructive: `
          bg-destructive text-white hover:bg-destructive/90
          focus-visible:ring-destructive/30 dark:focus-visible:ring-destructive/40
        `,
        outline: `
          border border-input bg-background text-foreground
          hover:bg-primary hover:text-white dark:border-input dark:hover:bg-muted rounded-full
        `,
        secondary: `
          border border-black text-black dark:text-white font-bold bg-transparent 
          hover:bg-black hover:text-white dark:hover:text-black dark:hover:bg-white dark:bg-white/10
          dark:border-white rounded-full
        `,
        ghost: `
          bg-transparent hover:bg-muted hover:text-accent-foreground
          dark:hover:bg-muted
        `,
        link: `
          text-primary underline-offset-4 hover:underline
        `,
      },
      size: {
        default: `
          h-[clamp(2.25rem,4vw,2.75rem)]
          px-[clamp(1rem,2.5vw,1.5rem)]
        `,
        sm: `
          h-[clamp(1.875rem,3vw,2.25rem)]
          px-[clamp(0.75rem,2vw,1.25rem)]
          gap-[clamp(0.25rem,0.75vw,0.5rem)]
        `,
        lg: `
          h-[clamp(2.75rem,5vw,3.25rem)]
          px-[clamp(1.25rem,3vw,2rem)]
          w-full
        `,
        icon: `
          h-[clamp(2.25rem,4vw,2.75rem)]
          w-[clamp(2.25rem,4vw,2.75rem)]
          p-[clamp(0.25rem,1vw,0.5rem)]
        `,
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }