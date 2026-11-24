"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        "w-full mb-[clamp(0.75rem,2vw,1rem)] last:mb-0",
        className
      )}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex w-full">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(`
          flex 
          w-full 
          items-center 
          text-[clamp(14px,2vw,24px)] 
          justify-between 
          gap-[clamp(0.5rem,2vw,1rem)] 
          sm:w-100
          md:w-full
          h-[clamp(52px,25vw,85px)] 
          rounded-[clamp(16px,2vw,30px)] 
          bg-white/60
          dark:bg-white/3 
          backdrop-blur-sm 
          border 
          border-white 
          dark:border-gray-500/30 
          py-[clamp(1rem,2.5vw,1.5rem)] 
          px-[clamp(1.25rem,3vw,2rem)] 
          text-left 
          font-semibold 
          transition-all 
          duration-300 
          ease-in-out 
          outline-none 
          hover:bg-white/50 
          dark:hover:bg-white/10 
          focus-visible:ring-2 
          focus-visible:ring-blue-500/50 
          disabled:pointer-events-none 
          disabled:opacity-50 
          [&[data-state=open]>svg]:rotate-180 data-[state=open]:rounded-b-none 
          data-[state=open]:border-b-0 
          shadow-[inset_0_0_20px_0_rgba(255,255,255,0.05),2px_4px_8px_4px_rgba(0,0,0,0.05)] 
          dark:shadow-[inset_0_0_20px_0_rgba(255,255,255,0.05),0_4px_8px_0_rgba(0,0,0,0.25)] 
          cursor-pointer 
          3xl:min-w-[1400px]`,
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="w-[clamp(1.25rem,2.5vw,2rem)] h-[clamp(1.25rem,2.5vw,2rem)] shrink-0 transition-transform duration-200 rounded-full p-1 bg-white dark:bg-white/10 shadow-[0_0_10px_0_rgba(0,0,0,0.10)]" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className={cn(
        "overflow-hidden w-full transition-all duration-300 ease-in-out data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down sm:w-100 md:w-full m 3xl:min-w-[1400px]",
        className
      )}
      {...props}
    >
      <div className="
        px-[clamp(1.25rem,3vw,2rem)] 
        py-[clamp(1rem,2.5vw,1.5rem)] 
        bg-white/80 
        dark:bg-white/3 
        rounded-b-[clamp(16px,2vw,30px)] 
        border border-t-0 border-black/5 dark:border-gray-500/30 
        w-full                                  
        dark:shadow-[inset_0_0_20px_0_rgba(255,255,255,0.05),0_4px_8px_0_rgba(0,0,0,0.25)]
      ">
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }