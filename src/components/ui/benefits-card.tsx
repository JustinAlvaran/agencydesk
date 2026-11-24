"use client"
import React from "react"
import Image from "next/image"

type Props = {
  title: string
  description: string
  icon?: string | React.ReactNode
}

const BenefitsCard = ({ title, description, icon }: Props) => {
  return (
    <article
      aria-label={title}
      className="
        flex flex-col justify-center items-center text-center
        gap-[clamp(1.25rem,2vw,1.25rem)]
        py-[clamp(3.125rem,3vw,5rem)]
        px-[clamp(1.25rem,3vw,2.5rem)]
        rounded-[clamp(30px,3vw,40px)]
        bg-white/40 dark:bg-white/10
        backdrop-blur-md
        border dark:border-white/10
        transition-all duration-300 ease-in-out
        hover:bg-white/60 dark:hover:bg-white/15
        sm:w-100
        xs:w-81
        h-[clamp(246px,20vw,427px)]
        w-[clamp(23rem,20vw,31.63rem)]
        md:w-90
        3xl:w-126.5
        3xl:h-[22.563rem]
        shadow-[inset_0_0_20px_0_rgba(255,255,255,0.1)]
      "
    >
      <div className="flex flex-col justify-center items-center gap-5 flex-[1_0_0]">
        {/* Icon */}
        {typeof icon === "string" ? (
          <Image
            src={icon}
            alt={title}
            width={60}
            height={60}
            className="w-full h-full sm:w-15 sm:h-15"
          />
        ) : (
          icon
        )}

        {/* Title */}
        <h3
          className="
            font-bold font-montserrat leading-tight
            text-[clamp(1.375rem,2.5vw,1.875rem)]
          "
        >
          {title}
        </h3>

        {/* Description */}
        <p
          className="
            font-normal font-lato leading-relaxed text-secondary dark:text-secondary-foreground
            text-[clamp(0.875rem,1.4vw,1.125rem)]
            max-w-[min(36rem,85vw)]
          "
        >
          {description}
        </p>
      </div>
    </article>
  )
}

export default BenefitsCard