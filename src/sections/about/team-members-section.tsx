import TeamMemberCard from '@/components/ui/team-member-card';
import React from 'react'


type TeamMember = {
  avatar: string
  fullname: string
  position: string
  order: number
}

const TeamMembersSection = ({ teamMembers }: { teamMembers: TeamMember[] }) => {
  return (
    <>
      <div className="flex flex-col justify-center items-center py-10 px-5 lg:py-[100px] lg:px-[100px] backdrop-blur-2xl xs:hidden sm:hidden md:hidden">
        <div className="flex flex-col gap-5 py-10">
          <h2 className="xs:text-2xl xs:text-center lg:text-6xl font-bold">Meet Our Team</h2>
          <p className="text-center">Experienced Professionals Dedicated To Your Success</p>
        </div>
        <div className="flex flex-col pb-5">
          {teamMembers.map((item, index) => (
            <TeamMemberCard order={item.order} key={index} fullname={item.fullname} position={item.position} avatar={item.avatar} className={`${item.order !== 1 ? "hidden" : "block"}`}/>
          ))}
        </div>
        <div className="flex flex-row flex-wrap justify-around lg:grid grid-cols-3 lg:grid-cols-3 gap-5">
          {teamMembers.map((item, index) => (
            <TeamMemberCard order={item.order} key={index} fullname={item.fullname} position={item.position} avatar={item.avatar} className={`${item.order === 1 ? "hidden" : "block"} 2xl:${item.order === 1 ? "block" : "hidden"}`}/>
          ))}
        </div>
      </div>
      <div className="flex flex-col justify-center items-center py-10 px-5 lg:py-[100px] lg:px-[100px] backdrop-blur-2xl 2xl:flex">
        <div className="flex flex-col gap-5 py-10">
          <h2 className="xs:text-2xl xs:text-center lg:text-6xl font-bold">Meet Our Team</h2>
          <p className="text-center">Experienced Professionals Dedicated To Your Success</p>
        </div>
        <div className="flex flex-row flex-wrap justify-around lg:grid grid-cols-3 lg:grid-cols-3 gap-5">
          {teamMembers.map((item, index) => (
            <TeamMemberCard order={item.order} key={index} fullname={item.fullname} position={item.position} avatar={item.avatar} />
          ))}
        </div>
      </div>
    </>
  )
}

export default TeamMembersSection