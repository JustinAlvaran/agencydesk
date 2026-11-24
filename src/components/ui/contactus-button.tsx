"use client"
import React, { useState } from "react"
import Link from "next/link"

const ContactUsButton = () => {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href="/contact"
      onMouseEnter={() => setHovered(true)}
      className="relative flex items-center justify-center isolate
        font-montserrat font-semibold text-[clamp(0.75rem,1.25vw,1.25rem)]
        border border-[#828282] rounded-[99px]
        px-[clamp(1.25rem,2vw,1.75rem)] py-[clamp(0.75rem,1.5vw,1rem)]
        text-black dark:text-white transition-all duration-300 ease-in-out group
        hover:border-primary/80"
    >
      <div className="relative z-2 flex flex-col items-center">
        <p className="text-center leading-5 uppercase">CONTACT US</p>
      </div>
      {/* Hover ellipse indicator */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
        w-[7.2px] h-[7.2px] z-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="w-full h-full rounded-full bg-white/30" />
      </div>
      {/* Ripple effect */}
      <span
        className={`
          absolute left-[35%] inset-0 rounded-full
          bg-slate-800 dark:bg-slate-100 opacity-0
          motion-safe:group-hover:animate-cta-ripple
          ${hovered ? "motion-safe:group-not-[&:hover]:animate-cta-ripple-reverse" : ""}
        `}
      />
    </Link>
  )
}

export default ContactUsButton
