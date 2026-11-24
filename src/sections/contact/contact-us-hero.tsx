import React from 'react'
import ResponsiveSectionWrapper from "@/components/ui/responsive-section-wrapper"
import { ContactUsForm } from '@/components/forms/contact-us-form'

const ContactUsHero = () => {
  return (
    <ResponsiveSectionWrapper className="items-center contact-us-bg pb-[clamp(5rem,12vw,10rem)]">
      <div className="
        flex 
        flex-col 
        gap-[clamp(2rem,5vw,2.5rem)] 
        justify-center 
        items-center 
        py-[clamp(3rem,8vw,5rem)] 
        text-[clamp(0.875rem,1.8vw,1.125rem)] 
        max-w-[min(60rem,90vw)] 
        mx-auto 
        px-[clamp(1rem,3vw,2rem)]
        mt-10
      ">
        <h2 className="font-bold font-montserrat text-[clamp(2.75rem,5vw,3.75rem)] lg:pt-[clamp(5rem,12vw,10rem)] leading-tight text-center">
          Let&apos;s Work Together
        </h2>
        <p className="text-center leading-relaxed">
          Let&apos;s connect, collaborate, & bring your goals to life
        </p>
        <ContactUsForm />
      </div>
    </ResponsiveSectionWrapper>
  )
}

export default ContactUsHero