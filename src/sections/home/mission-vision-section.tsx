import MissionVisionCard from '@/components/ui/missionvisioncard'
import React from 'react'

const MissionVisionSection = () => {
  const values = [
    {
      title: "Our Mission",
      description:
        "To empower organizations with technologies that accelerate growth, enhance customer experiences, and streamline operations through innovation. ",
      link: "",
    },
    {
      title: "Our Vision",
      description:
        "To be the leading IT solutions partner trusted globally for reliability, innovation, and world-class delivery. ",
      link: "",
    },
  ]

  return (
    <section
      id="mission-vision"
      className="
        backdrop-blur-2xl
        flex
        flex-col
        sm:flex-col
        md:flex-col
        xl:flex-row
        justify-center
        gap-[clamp(2.5rem,5vw,5rem)]
        py-[clamp(2.5rem,6vw,6.25rem)]
        px-[clamp(1.25rem,6vw,10rem)]
        max-w-[min(90rem,95vw)]
        3xl:min-w-[1600px]
        mx-auto
        transition-all
        duration-300
      "
    >
      {values.map((value, index) => (
        <MissionVisionCard
          key={index}
          title={value.title}
          description={value.description}
          link={value.link}
        />
      ))}
    </section>
  )
}

export default MissionVisionSection