import { Slot } from "@radix-ui/react-slot";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes } from "react";

export function cn(...values: Parameters<typeof clsx>) { return twMerge(clsx(...values)); }
export function Button({ asChild, variant = "primary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; variant?: "primary" | "secondary" | "ghost" }) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn("button", `button-${variant}`, className)} {...props} />;
}
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input className={cn("input", className)} {...props} />; }
export function Badge({ className, tone = "neutral", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "blue" | "green" | "amber" | "red" }) { return <span className={cn("badge", `badge-${tone}`, className)} {...props} />; }
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("panel", className)} {...props} />; }
