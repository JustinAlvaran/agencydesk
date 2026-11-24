import React from 'react'
import Image from "next/image"

type Props = {
  fullname: string
  position: string
  avatar: string
  order: number
  className?: string
}

const TeamMemberCard = (props: Props) => {
  return (
    <div className={`${props.order !== 1 ? "w-[43svw] max-w-[43svw] h-[30svh] max-h-[30svh] 2xl:min-w-[440px] 2xl:max-w-[440px] 2xl:min-h-[360px] 2xl:max-h-[480px] flex flex-col items-center justify-center p-4 border-2 border-slate-100/80 rounded-[30px] shadow-md backdrop-blur-xl dark:border-slate-100/10 dark:border-[1px] gap-5" : "flex flex-col gap-5 items-center justify-center p-4 border-2 border-slate-100/80 rounded-[30px] shadow-md xs:min-w-[354px] xs:min-h-[328px] sm:min-w-[430px] sm:min-h-[328px] lg:min-w-[504px] lg:min-h-[528px] 2xl:min-w-[440px] 2xl:max-w-[440px] 2xl:min-h-[360px] 2xl:max-h-[480px] backdrop-blur-xl dark:border-slate-100/10 dark:border-[1px]"}  ${props.className}`}>
      <Image className={`${props.order === 1 ? "xs:w-[96px] xs:h-[96px] lg:w-[160px] lg:h-[160px]" : "xs:w-[87px] xs:h-[87px] lg:w-[160px] lg:h-[160px]"} rounded-full border-2 border-red-600`} src={props.avatar} alt={props.fullname} width={200} height={200} />
      <div className='text-center gap-2 flex flex-col'>
        <p className='text-lg font-bold'>{props.fullname}</p>
        <p className='text-lg text-semibold text-primary font-lato'>{props.position}</p>
      </div>
    </div>
  )
}

export default TeamMemberCard