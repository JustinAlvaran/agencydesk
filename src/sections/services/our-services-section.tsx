"use client"
import React, { useState, useEffect } from "react";
import ServicesCard from "@/components/ui/services-card";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const otherServices = [
  {
    title: "Web & Mobile Development",
    description: "Smart, scalable, and user-first digital platforms that drive results.",
    icon: "/services-icons/webmobile.svg",
    link: "/services/web-and-mobile-development",
  },
  {
    title: "Cloud Hosting & Infrastructure",
    description: "Migrate, Optimize, And Scale Your Infrastructure With Our Comprehensive Cloud Services And Multi-Platform Expertise.",
    icon: "/services-icons/cloud.svg",
    link: "/services/cloud-hosting",
  },
  {
    title: "Cybersecurity Solutions",
    description: "Protect Your Digital Assets With Enterprise-Grade Security Solutions Designed For Modern Threats And Compliance Requirements.",
    icon: "/services-icons/security.svg",
    link: "/services/cybersecurity",
  },
  {
    title: "Content & Affiliate Marketing",
    description: "Crafting Viral Content And Executing Powerful Affiliate Marketing Strategies To Amplify Reach, Engage Audiences, And Drive Brand Growth.",
    icon: "/services-icons/affiliate.svg",
    link: "/services/content-marketing",
  },
  {
    title: "Big Data & Analytics",
    description: "Transform your data into actionable insights with our advanced analytics and machine learning solutions.",
    icon: "/services-icons/research.svg",
    link: "/services/big-data-analytics",
  },
  {
    title: "DevOps & Automation",
    description: "Specialized IT solutions tailored to your industry's unique requirements and challenges.",
    icon: "/services-icons/niche.svg",
    link: "/services/devops-automation",
  },
];

const OurServicesSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);

  // Dynamically adjust number of items per page based on screen size
  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 640) setItemsPerPage(1); // Mobile
      else if (window.innerWidth < 1024) setItemsPerPage(2); // Tablet
      else setItemsPerPage(3); // Desktop
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const totalPages = Math.ceil(otherServices.length / itemsPerPage);
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % totalPages);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  const goToSlide = (index: number) => setCurrentIndex(index);

  return (
    <section className="py-[clamp(3rem,8vw,6rem)] px-[clamp(1rem,4vw,3rem)] bg-transparent backdrop-blur-2xl">
      {/* Header */}
      <div className="max-w-[min(90rem,95vw)] mx-auto text-center mb-[clamp(3rem,6vw,5rem)]">
        <div className="inline-block px-[clamp(1rem,2vw,1.5rem)] py-[clamp(0.375rem,1vw,0.5rem)] mb-[clamp(1rem,2vw,1.5rem)] text-[clamp(0.75rem,1.5vw,0.875rem)] font-medium text-red-500 bg-red-500/10 rounded-full border border-red-500/20 uppercase tracking-wide">
          OUR SERVICES
        </div>
        <h2 className="text-[clamp(2rem,5vw,3.75rem)] font-bold text-black dark:text-white leading-tight">
          Explore Other Services
        </h2>
      </div>

      {/* Carousel Container */}
      <div className="relative max-w-[min(100rem,95vw)] 3xl:max-w-[1620px] mx-auto">
        {/* Desktop Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="sm:translate sm:translate-y-52 sm:translate-x-10 lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[clamp(1rem,3vw,4rem)] z-20 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white p-[clamp(0.75rem,1.5vw,1rem)] rounded-full border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer items-center justify-center"
          aria-label="Previous slide"
        >
          <ChevronLeftIcon className="w-[clamp(1.5rem,2.5vw,2rem)] h-[clamp(1.5rem,2.5vw,2rem)]" />
        </button>
        
        <button
          onClick={nextSlide}
          className="sm:translate sm:translate-y-52 sm:-translate-x-10 lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-[clamp(1rem,3vw,4rem)] z-20 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white p-[clamp(0.75rem,1.5vw,1rem)] rounded-full border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer items-center justify-center"
          aria-label="Next slide"
        >
          <ChevronRightIcon className="w-[clamp(1.5rem,2.5vw,2rem)] h-[clamp(1.5rem,2.5vw,2rem)]" />
        </button>

        {/* Slides Container */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {Array.from({ length: totalPages }).map((_, pageIndex) => (
              <div key={pageIndex} className="w-full shrink-0">
                <div className="grid grid-cols-1 grid-rows-1 md:grid-cols-2 lg:grid-cols-3 gap-[clamp(1.5rem,3vw,2rem)] px-[clamp(0.5rem,2vw,1rem)]">
                  {otherServices
                    .slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage)
                    .map((service, index) => (
                      <div key={`${pageIndex}-${index}`} className="flex justify-center py-4">
                        <ServicesCard
                          title={service.title}
                          description={service.description}
                          icon={service.icon}
                          link={service.link}
                          size="carousel"
                        />
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center mt-[clamp(2rem,5vw,3rem)] gap-[clamp(0.5rem,1vw,0.75rem)]">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-[clamp(0.5rem,1.5vw,0.625rem)] h-[clamp(0.5rem,1.5vw,0.625rem)] rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-gray-400 dark:bg-white scale-125"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex ? "true" : "false"}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default OurServicesSection;