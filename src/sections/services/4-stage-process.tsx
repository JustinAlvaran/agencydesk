import React from 'react'
import StagesCard from '@/components/ui/stages-card'
import Image from 'next/image'

const processSteps = [
  {
    step: 1,
    title: "Discovery Phase",
    description: "During this initial stage, we delve deep into understanding your business goals, target audience, and market landscape. We conduct thorough research and analysis to identify opportunities and challenges, laying the foundation for a successful campaign.",
    icon: <Image src="/icons/magnify.svg" alt="Discovery Icon" width={60} height={60}/>
  },
  {
    step: 2,
    title: "Strategy Development",
    description: "With insights gathered from the discovery phase, we develop a customized strategy tailored to your specific needs and objectives. This comprehensive plan outlines the key tactics, channels, and timelines needed to achieve your business goals effectively.",
    icon: <Image src="/icons/bulb.svg" alt="Strategy Icon" width={60} height={60}/>
  },
  {
    step: 3,
    title: "Implementation & Execution",
    description: "Once the strategy is approved, our team puts the plan into action using cutting-edge tools to execute with precision, from SEO optimization to engaging content and compelling visuals.",
    icon: <Image src="/icons/gear.svg" alt="Implementation Icon" width={60} height={60}/>
  },
  {
    step: 4,
    title: "Deployment & Optimization",
    description: "We continuously track KPIs and metrics, making data-driven adjustments to optimize results, adapt to market changes, and maximize ROI.",
    icon: <Image src="/icons/chart.svg" alt="Deployment Icon" width={60} height={60}/>
  }
]

const FourStageProcess = () => {
  return (
    <section className="container mx-auto flex flex-col gap-10 xl:gap-25 justify-center items-center h-full w-full bg-transparent backdrop-blur-2xl sm:py-12.5 xl:py-25">
      <div className="flex flex-col sm:gap-5 xl:gap-10 justify-center items-center">
        <div className="rounded-full text-[clamp(0.75rem,1vw,1rem)] font-montserrat font-bold bg-white/10 backdrop-blur-2xl px-6 py-2 text-primary">OUR PROCESS</div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-8 xs:mb-10 sm:mb-12 md:mb-14 lg:mb-16 xl:mb-18 2xl:mb-20 3xl:mb-22 text-black dark:text-white">
          4 Stage Process
        </h2>
      </div>
      <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 3xl:grid-cols-2 gap-[clamp(20px,4vw,40px)]">
        {processSteps.map((processStep, index) => (
          <StagesCard key={index} step={processStep.step} title={processStep.title} description={processStep.description} icon={processStep.icon} />
        ))}
      </div>
    </section>
  )
}

export default FourStageProcess