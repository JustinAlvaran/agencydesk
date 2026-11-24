"use client";

import React from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/20/solid";

type Props = {
  className?: string;
  title: string;
  icon?: React.ReactNode;
  link?: string;
  onClick?: (job_applied: string) => void;
  dualArrow?: boolean;
};

const CTAButton = ({
  className = "",
  title,
  icon,
  link = "#",
  onClick,
  dualArrow = true,
}: Props) => {
  return (
    <Link
      href={link}
      onClick={() => onClick && onClick(title)}
      data-testid="cta-button-root"
      className={`
        group relative inline-flex items-center justify-center select-none overflow-hidden
        rounded-full font-semibold text-sm tracking-wide text-white
        bg-primary hover:bg-primary/90
        /* Optical padding (Charles/Emil: 2x horizontal padding, 2-3px less on icon side) */
        py-3.5 pl-7 pr-6
        gap-2.5
        /* Layered Depth: Crisp contact perimeter + rich crimson ambient glow */
        shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.08),0_12px_24px_-6px_oklch(65.32%_0.233_25.74_/_0.35)]
        hover:shadow-[0_0_0_1px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.12),0_16px_32px_-6px_oklch(65.32%_0.233_25.74_/_0.45)]
        /* Charles / Emil Kowalski tactile press feedback (scale 0.96 with ease-out spring) */
        transition-[transform,background-color,box-shadow] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]
        active:scale-[0.96]
        outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        ${className}
      `}
    >
      {/* 1. Specular Top Rim Highlight (Apple hardware / glass edge craft) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent"
      />

      {/* 2. Smooth Diagonal Light Sheen Sweep on Hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/18 to-transparent transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-full"
      />

      {/* 3. Button Label */}
      <span className="relative z-10">{title}</span>

      {/* 4. Emil Kowalski Signature Dual-Arrow Conveyor / Glide */}
      <span
        aria-hidden="true"
        className="relative z-10 inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden"
      >
        {icon && !dualArrow ? (
          <div className="transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
            {icon}
          </div>
        ) : (
          <>
            {/* Arrow 1: in-place, slides right and fades on hover */}
            <ArrowRightIcon className="absolute h-4 w-4 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-4 group-hover:opacity-0" />
            {/* Arrow 2: staged left, slides in to 0 on hover */}
            <ArrowRightIcon className="absolute h-4 w-4 -translate-x-4 opacity-0 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0 group-hover:opacity-100" />
          </>
        )}
      </span>
    </Link>
  );
};

export default CTAButton;
