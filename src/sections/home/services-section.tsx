import React from 'react'
import ServicesCard from '@/components/ui/services-card'

const services = [
  {
    title: "Web & Mobile Development",
    description: "Build modern, responsive, and scalable applications with cutting-edge technologies and robust best practices.",
    icon: "/services-icons/webmobile.svg",
    link: "/services/web-and-mobile-development"
  },
  {
    title: "Cloud Hosting & Infrastructure",
    description: "Migrate, optimize, and scale your infrastructure across cloud platforms — ensuring reliability, performance, and security.",
    icon: "/services-icons/cloud.svg",
    link: "/services/cloud-hosting"
  },
  {
    title: "Big Data & Analytics",
    description: "Unlock actionable insights by mining complex data for trends, patterns, and growth opportunities.",
    icon: "/services-icons/big-data-analytics.svg",
    link: "/services/big-data-analytics"
  },
  {
    title: "Cybersecurity Solutions",
    description: "Secure your digital assets with enterprise-grade protections designed for modern threats and compliance standards.",
    icon: "/services-icons/security.svg",
    link: "/services/cybersecurity"
  },
  {
    title: "Content & Affiliate marketing",
    description: "Expand your reach and grow brand awareness with targeted content strategies and performance-driven affiliate marketing campaigns. ",
    icon: "/services-icons/affiliate.svg",
    link: "/services/content-marketing"
  },
  {
    title: "DevOps & Automation",
    description: "Accelerate delivery with CI/CD, infrastructure as code, and automation that improves reliability, scalability, and release velocity.",
    icon: "/services-icons/niche.svg",
    link: "/services/devops-automation"
  },
  {
    title: "AI, Automation & R&D",
    description: "Harness the power of AI and automation to streamline operations, drive innovation, and develop custom products.",
    icon: "/services-icons/research.svg",
    link: "/services/research-development"
  },
]

const ServicesSection = () => {
  return (
    <section 
      id="services" 
      className="
        flex flex-col 
        gap-[clamp(1.25rem,3vw,2rem)]
        justify-center items-center 
        pt-24 sm:pt-28 
        pb-[clamp(2.5rem,8vw,6.25rem)]
        px-[clamp(1.25rem,5vw,10rem)]
        backdrop-blur-2xl
        scroll-mt-24
      "
    >
      <header className="flex flex-col justify-center items-center gap-5 xl:gap-2.5 2xl:gap-4">
        <h3 className="
          text-center 
          text-[clamp(1.875rem,5vw,3.75rem)]
          font-bold 
          font-montserrat 
          text-black dark:text-white
          leading-tight
        ">
          Our Services
        </h3>
        
        <p className="
          text-center 
          font-normal 
          font-lato 
          text-gray-600 dark:text-gray-200
          text-[clamp(14px,1.8vw,22px)]
          leading-relaxed
          max-w-[min(70rem,90vw)]
        ">
          We deliver cutting-edge technology solutions that transform businesses and drive growth.
        </p>
      </header>

      <div className="
        grid 
        grid-cols-1 
        md:grid-cols-2 
        xl:grid-cols-3 
        gap-[clamp(1.25rem,3vw,3.125rem)] 
        w-full 
        max-w-7xl 
        justify-items-center 
        items-stretch 
        auto-rows-fr 
        mx-auto">
        {services.map((service, index) => (
          <ServicesCard 
            key={index} 
            title={service.title} 
            description={service.description} 
            icon={service.icon} 
            link={service.link} 
          />
        ))}
      </div>
    </section>
  )
}

export default ServicesSection