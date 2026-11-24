import React from 'react'
import Image from "next/image"

type Props = {
  icon: string
  title: string
  subtitle: string
  backgroundImage: string
}


const ServicesHero = (props: Props) => {
  return (
    <section data-testid="services-hero-section" role="region" 
      className="
        w-full 
        min-h-[70vh] lg:min-h-screen 
        flex 
        flex-col 
        gap-12 lg:gap-20 
        justify-center 
        items-center 
        mx-auto 
        relative
        overflow-hidden
        px-4
        backdrop-blur-2xl
    ">
      <Image className="z-20" src={props.icon} alt="service icon" width={86} height={86}/>
      
      <h1 className="z-20 text-2xl md:text-5xl font-bold text-center text-black dark:text-white">{props.title || "Web & Mobile Development"}</h1>
      
      <h2 className="z-20 text-[16px] md:text-xl text-center font-lato text-black dark:text-muted-foreground max-w-100 sm:max-w-102 xl:max-w-200">{props.subtitle || "Smart, scalable, and user-first digital platforms that drive results"}</h2>
      
      <div className='absolute inset-0 bg-linear-to-b from-white/60 via-10% to-white/60 dark:from-black/60 dark:via-30% dark:to-black/60 z-10'/>

      <Image className="-z-10 opacity-50 object-cover" src={props.backgroundImage} alt="background image" fill/>
    </section>
  )
}

export default ServicesHero