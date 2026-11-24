import React from 'react'
import FeaturesCard from '@/components/ui/features-card'
import Image from 'next/image'


const competitiveEdgeData = [
  {
    title: "Proven Track Record",
    description: "We have built a reputation as a trusted and reliable partner in achieving business success.",
    icon: <Image src="/features-icon/record.webp" alt="" width={78} height={78} />
  },
  {
    title: "Tailored Solutions",
    description: "We offer personalized solutions tailored to your specific goals, audience, and industry.",
    icon: <Image src="/features-icon/client.webp" alt="" width={78} height={78} />
  },
  {
    title: "Client-Centric Focus",
    description: "Your success is our priority. We prioritize understanding your business goals.",
    icon: <Image src="/features-icon/solutions.webp" alt="" width={78} height={78} />
  },
  {
    title: "Transparent Communication",
    description: "We believe in open and honest communication every step of the way.",
    icon: <Image src="/features-icon/communication.svg" alt="" width={78} height={78} />
  },
  {
    title: "Dedicated Support",
    description: "Your success is our priority, and we're here to support you every step of the way.",
    icon: <Image src="/features-icon/support.svg" alt="" width={78} height={78} />
  },
  {
    title: "Expertise Among Industries",
    description: "Your success is our priority. We prioritize understanding your business goals.",
    icon: <Image src="/features-icon/expertise.svg" alt="" width={78} height={78} />
  }
]

const WhyChooseUs = () => {
  return (
    <section data-testid="why-choose-us-section" className="container mx-auto flex flex-col sm:gap-12.5 justify-center items-center h-full w-full bg-transparent backdrop-blur-2xl px-[clamp(0.75rem,1vw,40px)] py-[100px]">
      <div className="flex flex-col sm:gap-5 xl:gap-10 justify-center items-center">
        <div className="rounded-full bg-white/10 backdrop-blur-2xl px-6 py-2 text-primary font-medium">WHY CHOOSE US</div>
        <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-6xl 2xl:text-6xl 3xl:text-6xl font-bold text-center text-black dark:text-white">
          Our Competitive Edge
        </h2>
      </div>
      <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-3 gap-[clamp(1.25rem,5vw,2.5rem)]">
        {competitiveEdgeData.map((item, index) => (
          <FeaturesCard
            key={index}
            title={item.title}
            description={item.description}
            icon={item.icon}
            variant="secondary"
          />
        ))}
      </div>
    </section>
  )
}

export default WhyChooseUs