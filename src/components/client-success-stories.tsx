"use client"

import { useEffect, useState } from "react"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { getTestimonials } from "@/utils/getTestimonials"
import { Testimonial } from "@/types/testimonials"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface ClientSuccessStoriesProps {
  className?: string
}

export function ClientSuccessStories({ className }: ClientSuccessStoriesProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const data = await getTestimonials()
        setTestimonials(data)
      } catch (error) {
        console.error("Failed to load testimonials:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  useEffect(() => {
    if (!api) return
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)
    api.on("select", () => setCurrent(api.selectedScrollSnap() + 1))
  }, [api])

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "w-[clamp(1.2rem,1.5vw,1.5rem)] h-[clamp(1.2rem,1.5vw,1.5rem] mx-0.5",
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-400 dark:text-gray-500"
        )}
      />
    ))

  if (loading) {
    return (
      <section className={cn("py-[clamp(3rem,6vw,6rem)] bg-transparent text-white", className)}>
        <div className="container mx-auto px-[clamp(1rem,4vw,6rem)] text-center">
          <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-black dark:text-white mb-8">
            Client Success Stories
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white/10 border border-white/10 h-[400px] animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className={cn(
        "py-[clamp(3rem,6vw,8rem)] bg-transparent backdrop-blur-2xl text-white overflow-hidden",
        className
      )}
    >
      <div className="container mx-auto px-[clamp(1rem,4vw,6rem)]">
        {/* Title */}
        <div className="flex flex-col items-center text-center mb-[clamp(2rem,5vw,4rem)]">
          <Image src="/quote.svg" alt="quote icon" width={48} height={48} className="mb-4 opacity-80" />
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-black dark:text-white">
            Client Success Stories
          </h2>
          <p className="text-[clamp(0.9rem,2vw,1.1rem)] text-gray-700 dark:text-gray-300 mt-2 max-w-[60ch]">
            Hear from our partners about how we helped them achieve their goals.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-7xl mx-auto">
          <Carousel
            setApi={setApi}
            className="w-full"
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent className="-ml-2 sm:-ml-4">
              {testimonials.map((testimonial) => (
                <CarouselItem
                  key={testimonial.id}
                  className="pl-2 sm:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <Card className="bg-white/10 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-[inset_0_0_20px_0_rgba(255,255,255,0.05),0_4px_8px_0_rgba(0,0,0,0.25)] rounded-[clamp(0.75rem,15vw,2rem)] h-full transition-transform duration-300 sm:h-120 sm:w-100 p-12.5">
                    <CardContent className="gap-10 flex p-0 flex-col justify-between h-full">
                      {/* Rating */}
                      <div className="flex justify-center">{renderStars(testimonial.star_rating)}</div>

                      {/* Testimony */}
                      <blockquote className="italic text-start text-[clamp(0.9rem,2vw,1.1rem)] leading-relaxed text-black dark:text-white">
                        &ldquo;{testimonial.testimony}&rdquo;
                      </blockquote>

                      {/* Author */}
                      <div className="flex justify-end items-center gap-2.5">
                        <Avatar className="w-[clamp(2.5rem,4vw,3rem)] h-[clamp(2.5rem,4vw,3rem)]">
                          <AvatarImage
                            src={testimonial.author_image || "/placeholder-user.jpg"}
                            alt={testimonial.author_name}
                          />
                          <AvatarFallback>
                            {testimonial.author_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-right">
                          <p className="font-semibold text-black dark:text-white">
                            {testimonial.author_name}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-400">
                            {testimonial.author_position}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation */}
            {testimonials.length > 2 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex absolute -left-6 md:-left-10 top-1/2 -translate-y-1/2 z-10 
                             bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20
                             text-gray-800 dark:text-gray-200 rounded-full backdrop-blur-sm transition-all"
                  onClick={() => api?.scrollPrev()}
                >
                  <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex absolute -right-6 md:-right-10 top-1/2 -translate-y-1/2 z-10 
                             bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20
                             text-gray-800 dark:text-gray-200 rounded-full backdrop-blur-sm transition-all"
                  onClick={() => api?.scrollNext()}
                >
                  <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
                </Button>
              </>
            )}
          </Carousel>

          {/* Dots */}
          {count > 1 && (
            <div className="flex justify-center gap-2 mt-[clamp(1.5rem,4vw,2.5rem)]">
              {Array.from({ length: count }, (_, i) => (
                <button
                  key={i}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === current - 1
                      ? "bg-white w-2"
                      : "bg-white/40 dark:bg-white/40 w-2 hover:bg-gray-400"
                  )}
                  onClick={() => api?.scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
