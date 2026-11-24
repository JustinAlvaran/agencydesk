import React from 'react'

const KPI = [
  {
    title: "100",
    indicator: "+",
    description: "Delivered Projects"
  },
  {
    title: "50",
    indicator: "+",
    description: "Expert Team Members"
  },
  {
    title: "10",
    indicator: "+",
    description: "Years of Experience"
  },
  {
    title: "99",
    indicator: "%",
    description: "Client Satisfaction"
  }
]

const KPISection = () => {
  return (
    <div className="py-10 px-10 lg:py-[100px] lg:px-[100px] backdrop-blur-2xl">
      <div className="3xl:min-w-[1720px] flex xl:flex-row flex-col gap-[clamp(30px,4vw,100px)] justify-center items-center">
        {KPI.map((item, index) => (
          <KPICircle key={index} title={item.title} indicator={item.indicator} description={item.description} />
        ))}
      </div>
    </div>
  )
}

const KPICircle = ({ title, indicator, description }: { title: string; indicator: string; description: string }) => {
  return (
    <article className="bg-white dark:bg-white/15 backdrop-blur-2xl rounded-full flex flex-col gap-[0.938rem] justify-center items-center border border-white/10 h-full w-full aspect-square min-h-[237px] min-w-[237px] max-h-[316px] max-w-[316px] shadow-[0_0_20px_rgba(0,0,0,0.25)] sm:w-[14.813rem] sm:h-[14.813rem] leading-tight">
      <h3 className="text-[2.813rem] 2xl:text-5xl text-center text-black font-monserrat font-bold text-shadow-[0_0_10px_rgba(0,0,0,0.25)] dark:text-white">{title}<span className="text-red-500">{indicator}</span></h3>
      <p className="text-[0.938rem] 2xl:text-md text-center font-lato dark:text-white">{description}</p>
    </article>
  )
}

export default KPISection