import Link from 'next/link'
import React from 'react'
import { LuArrowUpToLine } from "react-icons/lu";

const ScrollToTop = () => {
  return (
    <Link href="#hero" 
      className={`
        fixed 
        bottom-24 
        right-3 
        bg-white 
        dark:bg-white/10 
        p-4 
        rounded-full 
        shadow-2xl 
        drop-shadow-xl 
        scroll-smooth 
        backdrop-blur-2xl 
        hover:bg-red-500 
        hover:text-white 
        duration-600 
        transition-all 
        z-50
      `}
    >
      <LuArrowUpToLine size={30} className="min-w-[30px] min-h-[30px]"/>
    </Link>
  )
}

export default ScrollToTop