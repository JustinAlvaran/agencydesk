"use client";
import React, { useState } from "react";
import Link from "next/link";
import { IoIosArrowDown } from "react-icons/io";

export default function RippleButton({
  href,
  children,
  isDropDownMenu,
  onClick,
}: {
  href?: string;
  children: React.ReactNode;
  isDropDownMenu?: boolean;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href || ""}
      onMouseEnter={() => setHovered(true)}
      onClick={onClick}
      className="group relative flex flex-row justify-center items-center gap-[clamp(0.5rem,1.5vw,1rem)] overflow-hidden px-[clamp(1.5rem,3vw,3rem)] py-[clamp(1rem,2vw,2rem)] font-semibold text-[clamp(0.75rem,1.2vw,1.25rem)] text-black dark:text-white hover:text-red-600 duration-500 transition-all ease-in-out bg-transparent"
    >
      {children}
      <IoIosArrowDown 
        className={`text-black dark:text-white ${isDropDownMenu ? "block" : "hidden"} group-hover:rotate-180 transition-all duration-300 ease-in-out shrink-0`}
        style={{ width: 'clamp(1.25rem, 2.5vw, 2rem)', height: 'clamp(1.25rem, 2.5vw, 2rem)' }}
      />
      <span
        className={`
          absolute left-[34%] top-[25%] inset-0 rounded-full
          bg-slate-800 dark:bg-slate-100 opacity-0
          motion-safe:group-hover:animate-ripple
          ${hovered ? "motion-safe:group-not-[&:hover]:animate-ripple-reverse" : ""}
        `}
      />
    </Link>
  );
}