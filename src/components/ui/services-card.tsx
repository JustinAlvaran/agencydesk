"use client"
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRightIcon } from '@heroicons/react/20/solid'

type Props = {
  title: string
  description: string
  icon?: string
  link?: string
  size?: 'default' | 'medium' | 'carousel'
}

const ServicesCard = (props: Props) => {
  const { size = 'default' } = props

  // Fluid sizing configurations using clamp() for smooth scaling
  const sizeStyles = {
    default: {
      container: "w-full min-w-[min(18rem,90vw)] max-w-[26rem] h-[clamp(20.5rem,24vw,23rem)]",
      padding: "p-6 sm:p-7 xl:p-8",
      title: "text-[clamp(1.25rem,1.5vw,1.5rem)]",
      description: "text-sm sm:text-base",
      icon: "w-12 h-12 sm:w-14 sm:h-14",
      gap: "gap-4 sm:gap-5",
      iconMargin: "mb-2",
    },
    medium: {
      container: "w-full min-w-[min(16rem,90vw)] max-w-[32rem]",
      padding: "p-[clamp(1.5rem,3.5vw,3rem)]",
      title: "text-[clamp(1.125rem,2.8vw,1.875rem)]",
      description: "text-[clamp(0.875rem,1.6vw,1.125rem)]",
      icon: "w-[clamp(2.5rem,5.5vw,3.5rem)] h-[clamp(2.5rem,5.5vw,3.5rem)]",
      gap: "gap-[clamp(0.875rem,2.2vw,1.5rem)]",
      iconMargin: "mb-[clamp(0.5rem,1.5vw,1rem)]",
    },
    carousel: {
      container: "w-[clamp(407rem,15vw,407px)] min-w-[min(15rem,85vw)] max-w-[407px] h-[clamp(427px,15vw,484px)] aspect-square",
      padding: "p-[clamp(40px,3vw,50px)]",
      title: "text-[clamp(1.375rem,1vw,1.5rem)] 2xl:text-[1.5rem]",
      description: "text-[clamp(1rem,1.8vw,1.125rem)] xl:line-clamp-2 2xl:line-clamp-3",
      icon: "w-[clamp(3rem,6vw,4rem)] h-[clamp(3rem,6vw,4rem)]",
      gap: "gap-[clamp(1rem,2.5vw,1.5rem)]",
      iconMargin: "mb-[clamp(0.5rem,1.5vw,1rem)]",
    }
  }

  const currentStyle = sizeStyles[size]

  return (
    <div
      className={`
        flex flex-col justify-between items-center
        rounded-[clamp(1.5rem,3vw,2.5rem)]
        bg-white/10 dark:bg-white/10
        backdrop-blur-md text-center 
        border-2 border-white dark:border-white/10
        hover:bg-white/15 hover:border-primary dark:hover:border-primary
        transition-all duration-300 
        shadow-[0_4px_20px_0_rgba(0,0,0,0.10),inset_0_0_20px_0_rgba(255,255,255,0.80)]
        dark:shadow-[inset_0_0_20px_0_rgba(255,255,255,0.1)]
        ${currentStyle.container}
        ${currentStyle.padding}
        ${currentStyle.gap}
      `}
    >
      <div className="flex flex-col justify-between items-center h-full w-full">
        {props.icon && (
          <div className={`flex justify-center items-center shrink-0 ${currentStyle.iconMargin}`}>
            <Image
              src={props.icon}
              alt={props.title}
              width={80}
              height={80}
              className={`object-contain ${currentStyle.icon}`}
            />
          </div>
        )}

        <div className="flex flex-col items-start self-stretch gap-5 justify-center w-full">
          <h6 className={`
            font-montserrat leading-tight font-semibold line-clamp-2 md:line-clamp-1 xl:line-clamp-2 text-center self-center
            ${currentStyle.title}
          `}>
            {props.title}
          </h6>
          <p className={`
            text-primary-dark dark:text-secondary font-lato font-medium leading-relaxed text-start line-clamp-3
            ${currentStyle.description}
          `}>
            {props.description}
          </p>
        </div>

        <Link
          href={props.link || "#"}
          role="button"
          aria-label="Learn more"
          className={`
            group relative w-full overflow-hidden
            h-[clamp(2.5rem,5vw,3rem)]
            text-[clamp(0.8125rem,1.5vw,0.9375rem)]
            font-semibold uppercase tracking-wider
            flex items-center justify-center gap-1.5
            bg-transparent 
            border border-primary/50 text-black dark:text-white
            hover:bg-primary hover:text-white hover:border-primary
            cursor-pointer 
            transition-[transform,background-color,color,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]
            active:scale-[0.96]
            rounded-full
            shrink-0
          `}
        >
          {/* Subtle specular top highlight on hover */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
          />
          <span className="relative z-10">Learn more</span>
          <span
            aria-hidden="true"
            className="relative z-10 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center overflow-hidden"
          >
            <ArrowUpRightIcon className="absolute h-3.5 w-3.5 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-3.5 group-hover:-translate-y-3.5 group-hover:opacity-0" />
            <ArrowUpRightIcon className="absolute h-3.5 w-3.5 -translate-x-3.5 translate-y-3.5 opacity-0 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
          </span>
        </Link>
      </div>
    </div>
  )
}

export default ServicesCard