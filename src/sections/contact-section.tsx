"use client"

import { ContactForm } from "@/components/forms/contact-form"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import Image from "next/image"

export function ContactSection() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <section
      className="
        relative
        overflow-hidden
        bg-transparent
        backdrop-blur-2xl
        transition-all
        duration-300
      "
    >
      <div
        className="
          relative z-10
          flex
          flex-col
          lg:flex-row
          justify-center
          items-center
          gap-[clamp(1.5rem,4vw,5rem)]
          px-[clamp(1rem,4vw,3rem)]
          py-[clamp(2rem,6vw,5rem)]
          max-w-[min(90rem,95vw)]
          mx-auto
        "
      >
        <div
          className="
            w-full
            flex
            flex-col
            lg:flex-row
            justify-center
            items-center
            gap-[clamp(1rem,3vw,2rem)]
          "
        >
          <Image
            src={
              theme === "dark"
                ? "/images/LetsTalkDark.webp"
                : "/images/LetsTalkLight.webp"
            }
            alt="Let's Talk"
            className="
              hidden
              lg:block
              shrink-0
              max-w-[clamp(20rem,40vw,42rem)]
              h-auto
            "
            width={768}
            height={512}
            draggable={false}
          />

          {/* Mobile Header */}
          <Image
            className="
              block
              lg:hidden
              font-bold
              font-montserrat
              text-[clamp(2.25rem,6vw,4rem)]
              leading-[1.1]
              text-center
            "
            alt="lets talk"
            src={
              theme === "dark"
                ? "/images/letstalk-dark.svg"
                : "/images/letstalk-light.svg"
            }
            width={512}
            height={512}
          />
          <ContactForm />
        </div>
      </div>
    </section>
  )
}
