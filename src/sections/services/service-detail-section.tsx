"use client"

import React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { MdCheckCircleOutline } from "react-icons/md"
import { Button } from "@/components/ui/button"
import LoopingCarousel from "@/components/ui/looping-carousel"
import { ServiceDetail } from "@/types/service-detail"
import ServicesHero from "./services-hero"

interface ServiceDetailSectionProps {
  serviceDetail: ServiceDetail & {
    features?: {
      id: string
      title: string
      description: string
    }[]
  }
}

/* ---------- Helper Components ---------- */

const FeaturesSection = ({ features }: { features: { id: string; title: string; description: string }[] }) => {
  if (!features || features.length === 0) return null

  return (
    <div className="py-5 xl:py-10 md:py-0 space-y-4">
      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        {features.map((feature, index) => (
          <AccordionItem key={feature.id} value={`item-${index + 1}`}>
            <AccordionTrigger className="text-start text-sm sm:text-lg md:text-xl sm:w-85 h-[clamp(52px,15vw,105px)]">
              <div className="flex items-center justify-start gap-2">
                <MdCheckCircleOutline className="inline-block mr-2 text-primary" />
                {feature.title}
              </div>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance text-base sm:text-lg sm:w-85 md:w-full">
              <p>{feature.description}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

const CTASection = ({
  title,
  description,
  primaryButton,
  secondaryButton,
}: {
  title: string
  description: string
  primaryButton: string
  secondaryButton: string
}) => {
  const router = useRouter()

  const [firstPart, lastWord] = (() => {
    const words = title.split(" ")
    return [words.slice(0, -1).join(" "), words.at(-1)]
  })()

  return (
    <div className="
      flex 
      flex-col 
      md:flex-row 
      gap-[clamp(2.5rem,4vw,6.25rem)] 
      rounded-[clamp(1.875rem,8vw,3.75rem)] 
      bg-white/60 
      dark:bg-white/5 
      backdrop-blur-2xl 
      border 
      border-white 
      dark:border-white/10 
      px-6 
      py-8 
      xl:py-[100px] 
      xs:px-8 
      sm:px-10 
      md:px-10 
      lg:px-[70px] 
      xl:px-[100px] 
      2xl:px-[100px] 
      font-lato 
      w-full 
      shadow-[inset_0_0_20px_0_rgba(255,255,255,0.1)] 
      drop-shadow
      3xl:max-w-[1600px]
    ">
      <div className="flex flex-col gap-10 font-montserrat w-full">
        <h2 className="text-[clamp(3.125rem,4vw,7.5rem)] leading-normal font-bold text-black dark:text-white">
          {firstPart} <br />
          <span className="text-primary">{lastWord}</span>
        </h2>

        <p className="sm:leading-6 xl:leading-8 text-lg font-light font-lato xl:max-w-md 2xl:max-w-lg">
          {description}
        </p>

        {/* Desktop Buttons */}
        <div className="hidden md:flex md:flex-row justify-start items-center gap-5 py-5 w-1/2 pr-8">
          <Button
            className="rounded-full cursor-pointer xl:max-w-xs text-[clamp(10px,1vw,18px)]"
            size="lg"
            onClick={() => router.push("/contact")}
          >
            {primaryButton}
          </Button>
          <Button
            className="rounded-full cursor-pointer xl:max-w-xs"
            variant="secondary"
            size="lg"
            onClick={() => router.push("/apply-now")}
          >
            {secondaryButton}
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <LoopingCarousel
        images={["/images/image1.webp", "/images/image2.webp", "/images/image3.webp"]}
        interval={4000}
        className="sm:h-77.5 xl:h-100"
        pauseOnHover={true}
        objectFit="cover"
      />

      {/* Mobile Buttons */}
      <div className="flex flex-col md:hidden justify-start items-center gap-[clamp(1.25rem,1.5vw,2.5rem)]">
        <Button
          className="rounded-full cursor-pointer"
          size="lg"
          onClick={() => router.push("/contact")}
        >
          {primaryButton}
        </Button>
        <Button
          className="rounded-full cursor-pointer"
          variant="secondary"
          size="lg"
          onClick={() => router.push("/apply-now")}
        >
          {secondaryButton}
        </Button>
      </div>
    </div>
  )
}

/* ---------- Main Component ---------- */

const ServiceDetailSection: React.FC<ServiceDetailSectionProps> = ({ serviceDetail }) => {
  return (
    <div className="bg-transparent">
      {/* Hero Section */}
      <ServicesHero
        icon={serviceDetail.services_icon}
        title={serviceDetail.heroTitle}
        subtitle={serviceDetail.heroSubtitle}
        backgroundImage={serviceDetail.backgroundImage || "/images/computer-program-coding-screen.webp"}
      />

      {/* Content Section */}
      <section className="flex flex-col gap-[clamp(2.5rem,15vw,100px)] py-16 sm:py-24 lg:py-32 xl:py-[100px] px-4 sm:px-5 md:px-12 lg:px-16 xl:px-20 bg-transparent backdrop-blur-2xl">
        {/* Title */}
        <div className="flex flex-col justify-center gap-10 items-center text-center">
          <div className="text-md font-medium text-primary rounded-full dark:bg-white/20 backdrop-blur-2xl px-2 py-1 w-40 mx-auto">
            {serviceDetail.subtitle}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black dark:text-white">
            {serviceDetail.title}
          </h2>
        </div>

        {/* Main Description */}
        <div className="container mx-auto gap-10 flex flex-col items-center">
          <div className={`
            flex flex-col gap-10 2xl:gap-[100px] 
            3xl:max-w-[1600px]
            shadow-[0_4px_20px_0_rgba(0,0,0,0.10),inset_0_0_20px_0_rgba(255,255,255,0.80)] 
            dark:shadow-[inset_0_0_20px_0_rgba(255,255,255,0.1)] 
            rounded-[clamp(30px,10vw,60px)] 
            bg-linear-to-b from-white/60 via-white/50 to-white/60 
            dark:bg-white/5 dark:bg-linear dark:from-white/5 dark:via-white/5 dark:to-white/5 
            backdrop-blur-2xl border border-white dark:border-white/10 
            px-4 py-8 sm:py-10 sm:px-[30px] xl:py-[100px] xs:px-8 md:px-12 lg:px-[70px] xl:px-[100px] font-lato drop-shadow`}>
            {serviceDetail.main_image && (
              <Image
                src={serviceDetail.main_image}
                alt={serviceDetail.title}
                width={1080}
                height={720}
                priority
                sizes="(max-width: 768px) 100vw, 1080px"
                className="rounded-[clamp(20px,5vw,40px)] w-full object-cover 3xl:h-[362px] h-[clamp(242px,15vw,362px)] max-h-96"
              />
            )}

            <div className="space-y-6 text-xl leading-relaxed text-secondary ">
              {serviceDetail.description.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <div className="flex flex-col gap-5">
              <h2 className="text-start text-secondary font-semibold text-2xl font-montserrat">What Can You Expect</h2>
              <p className="text-xl">{serviceDetail.what_can_you_expect}</p>
            </div>

            {/* Features */}
            <FeaturesSection features={serviceDetail.features || []} />
          </div>

          {/* CTA Section */}
          <CTASection
            title={serviceDetail.cta_title}
            description={serviceDetail.cta_description}
            primaryButton={serviceDetail.cta_primary_button}
            secondaryButton={serviceDetail.cta_secondary_button}
          />
        </div>
      </section>
    </div>
  )
}

export default ServiceDetailSection
