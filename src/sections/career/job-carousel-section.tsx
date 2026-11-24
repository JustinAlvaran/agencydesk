"use client"
import React, { useState, useEffect } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import CareerCard from "@/components/ui/career-card"
import { Career } from '@/types/careers'
import { Button } from '@/components/ui/button'
import { cn } from "@/lib/utils"
import { useJobList } from '@/hooks/useJobList'
import Loader from '@/components/ui/loader'
import ErrorPage from '@/components/ui/error'


const JobCarouselSection = () => {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [count, setCount] = useState(0);
  const [current, setCurrent] = useState(0)
  const { jobs, loading, error } = useJobList();

  useEffect(() => {
    if (!api) return

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  if (loading) return <Loader />

  if (error) return <ErrorPage message={`Error: ${error}`} />

  return (
    <section id="job-carousel" className="flex flex-col gap-10 justify-center items-center bg-transparent xs:py-10 xs:px-5 lg:py-[100px] lg:px-[100px] h-full w-full backdrop-blur-2xl">
        <h2 className="text-3xl 2xl:text-6xl font-bold text-center">Discover Other Openings</h2>
        
        <Carousel 
            setApi={setApi}
            opts={{
                align: "center", 
                loop: true,
            }} 
            className="w-full"
        >
            <CarouselContent className="-ml-2 md:-ml-4">
                {jobs.map((job: Career, index: number) => (
                    <CarouselItem 
                      className="basis-full md:basis-1/2 lg:basis-1/3 pl-2 md:pl-4 py-6" 
                      key={index}
                    >
                        <div className="p-2 h-full">
                            <CareerCard 
                              {...job} 
                              link='/apply-now' 
                              onApply={() => {window.location.href = `/apply-now`}} 
                              isCarousel={true}
                            />
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            
            <CarouselPrevious className='hidden sm:flex hover:bg-primary hover:text-white text-black dark:text-white cursor-pointer' />
            <CarouselNext className='hidden sm:flex hover:bg-primary hover:text-white text-black dark:text-white cursor-pointer' />
        </Carousel>

        {jobs && jobs?.length === 0 && (
            <p className="text-center text-gray-500">No job positions found.</p>
        )}

        {/* Dots Container */}
        {jobs && count > 0 && (
          <div className="flex justify-center gap-2 mt-8 flex-wrap">
              {Array.from({ length: count }, (_, i) => (
              <button
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200",
                    i === current - 1 ? "bg-[#141414] dark:bg-white" : "bg-[#0f0f0f]/25 dark:bg-white/15 hover:bg-gray-400",
                  )}
                  onClick={() => api?.scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
              />
              ))}
          </div>
        )}

        {jobs && <Button variant="secondary" onClick={() => window.location.href = "/careers"} className="text-black dark:text-white hover:bg-slate-100 px-6 py-2 rounded-full cursor-pointer">
            BROWSE ALL
        </Button>}
    </section>
  )
}

export default JobCarouselSection