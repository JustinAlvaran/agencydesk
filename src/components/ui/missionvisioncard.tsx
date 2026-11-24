import Link from "next/link"
import { BsArrowRight } from "react-icons/bs"

type Props = {
  title: string
  description: string
  link: string
}

const MissionVisionCard = (props: Props) => {
  return (
    <div className="
      flex 
      flex-col 
      sm:gap-10
      gap-[clamp(2rem,2vw,3.125rem)] 
      justify-between 
      items-center 
      p-[clamp(2.5rem,1.5vw,3.125rem)] 
      lg:px-10 
      rounded-4xl 
      bg-white/10 
      dark:bg-white/10 
      backdrop-blur-md 
      text-center 
      border 
      dark:border 
      dark:border-white/10 
      w-[clamp(20rem,25vw,23.563rem)]
      h-[clamp(26.75rem,25vw,23.563rem)]
      self-center 
      sm:w-100
      sm:h-[23.563rem]
      2xl:min-w-190 
      hover:bg-white/15 
      duration-300 
      transition-colors 
      ease-in-out 
      shadow-[inset_0_0_20px_0_rgba(255,255,255,0.05)] 
      aspect-video
      "
    >
      <article className="flex flex-col justify-center items-center gap-10 flex-[1_0_0]">
        <h3 className="text-[1.875rem] text-center font-bold font-monserrat">{props.title}</h3>
        <p 
          className={`
            text-[clamp(1rem,1vw,1.25rem)] 
            text-start 
            dark:text-secondary 
            font-normal 
            font-lato 
            text-secondary
            p-[clamp(40px,50px)]
          `}>
            {props.description}
        </p>
        <Link href={props.link} className="flex-row flex self-start justify-start items-center gap-2 text-primary">Read More <BsArrowRight /></Link>
      </article>
    </div>
  )
}

export default MissionVisionCard