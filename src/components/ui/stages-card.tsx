"use client";

import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  step: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
};

const StagesCard = ({ step, title, description, icon, className }: Props) => {
  return (
    <Card
      className={cn(
        "flex flex-col justify-between h-full w-[clamp(20rem,38vw,48.75rem)] sm:w-[400px] md:w-[clamp(20rem,38vw,48.75rem)]",
        "px-[clamp(1.5rem,3vw,3rem)] py-[clamp(1.5rem,4vw,3.5rem)] sm:px-10 sm:py-7.5 gap-[clamp(1.25rem,3vw,3.125rem)]",
        "rounded-[clamp(1.5rem,2.5vw,2.5rem)] border-2 dark:border-white/10 border-white/70",
        "bg-white/60 dark:bg-white/5 backdrop-blur-2xl",
        "shadow-[inset_0_0_20px_rgba(255,255,255,0.1)] drop-shadow-lg",
        "hover:border-primary/80 transition-all duration-500 ease-in-out",
        className
      )}
    >
      {/* Inner shadow overlay */}
      <div className="absolute inset-0 pointer-events-none rounded-[clamp(1.5rem,2.5vw,2.5rem)] shadow-[inset_0px_0px_20px_0px_rgba(255,255,255,0.05)]" />

      {/* HEADER */}
      <CardHeader
        className={cn(
          "flex flex-row justify-between items-center w-full mb-[clamp(1rem,2vw,2rem)] p-0"
        )}
      >
        {icon && <div className="shrink-0">{icon}</div>}
        <span className="capitalize font-montserrat font-lato font-black text-[clamp(3.75rem,5vw,6.25rem)] text-muted-foreground/40 dark:text-muted-foreground">
          {step < 10 ? `0${step}` : step}
        </span>
      </CardHeader>

      {/* CONTENT */}
      <CardContent className="p-0 flex flex-col gap-[clamp(1.25rem,1.5vw,3.125rem)]">
        <h2 className="font-montserrat font-bold text-[clamp(1.25rem,2.5vw,2rem)] leading-snug">
          {title}
        </h2>
        <p className="font-lato font-medium text-[clamp(0.85rem,1.5vw,1rem)] text-secondary dark:text-gray-300 leading-relaxed text-balance">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

export default StagesCard;
