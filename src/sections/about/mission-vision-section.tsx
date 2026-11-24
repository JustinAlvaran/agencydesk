import Image from 'next/image'
import React from 'react'

const MissionVisionSection = () => {
  return (
    <div className="flex flex-col gap-10 justify-center items-center py-10 px-5 lg:py-[100px] lg:px-[100px] backdrop-blur-2xl">
      <div className="
        flex 
        flex-row 
        gap-20 
        justify-between 
        items-center 
        p-12.5
        lg:p-20 
        rounded-[clamp(1.875rem,2vw,3.125rem)] 
        shadow-[0_4px_20px_0_rgba(0,0,0,0.10),inset_0_0_20px_0_rgba(255,255,255,0.80)] 
        dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.10),inset_0_0_20px_0_rgba(255,255,255,0.2)] 
        lg:min-h-[600px] 
        dark:bg-black/5 
        backdrop-blur-2xl 
        dark:border dark:border-white/10 
        w-full
        max-w-375
      ">
        <div className="flex flex-col justify-between gap-12">
          <h2 className="text-3xl lg:text-6xl font-bold">Our <span className="text-primary">Mission</span></h2>
          
          <p className="font-lato text-lg lg:w-[80%] text-muted-foreground">Our mission is to eliminate agency chaos by providing a unified operating platform where client discovery, versioned scoping, transparent approval, and sprint delivery operate in complete harmony. We empower agencies to deliver predictable profitability while giving clients absolute confidence in every milestone.</p>
          <Image className="block lg:hidden mx-auto sm:w-59 sm:h-59" src="/icons/our-mission.svg" alt="mission" width={1000} height={1000} />
        </div>
        <Image className="hidden lg:block px-10 md:px-0" src="/icons/our-mission.svg" alt="mission" width={500} height={500} />
      </div>
      <div className="
        flex 
        flex-row 
        gap-20 
        justify-between 
        items-center 
        p-12.5
        lg:p-20 
        rounded-[clamp(1.875rem,2vw,3.125rem)] 
        shadow-[0_4px_20px_0_rgba(0,0,0,0.10),inset_0_0_20px_0_rgba(255,255,255,0.80)] 
        dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.10),inset_0_0_20px_0_rgba(255,255,255,0.2)] 
        lg:min-h-[600px] 
        dark:bg-black/5 
        backdrop-blur-2xl 
        dark:border dark:border-white/10 
        w-full
        max-w-375
      ">
        <Image className="hidden lg:block px-10 md:px-0 w-full" src="/icons/our-vision.svg" alt="vision" width={500} height={500} />
        <div className="flex flex-col justify-between gap-12">
          <h2 className="text-3xl lg:text-6xl font-bold">Our <span className="text-primary">Vision</span></h2>
          <p className="font-lato text-lg lg:w-[80%] text-muted-foreground">Our vision is to define the standard for modern digital agency operations globally—establishing a benchmark where fixed scopes replace ambiguity, live sprint telemetry replaces status meetings, and client collaboration feels effortless and empowering.
          </p>
          <Image className="block lg:hidden mx-auto sm:w-59 sm:h-59" src="/icons/our-vision.svg" alt="mission" width={1000} height={1000} />
        </div>
      </div>
    </div>
  )
}

export default MissionVisionSection