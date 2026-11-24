"use client"
import { Button } from '@/components/ui/button';
import CareerCard from '@/components/ui/career-card'
import React from 'react'
import { useRouter } from 'next/navigation';

type CareerItem = {
  id: string;
  field: string;
  title: string;
  description: string;
  employment_type: string;
  location: string;
  level: string;
}

type Props = {
  careers: CareerItem[];
}

const CareerSection = ({ careers }: Props) => {
  const route = useRouter()
  return (
    <section id="career" className="flex flex-col justify-center items-center py-10 px-5 lg:py-[100px] lg:px-40 backdrop-blur-2xl w-screen">
      <h3 className='text-center text-4xl text-black dark:text-white font-bold pb-5'>Open Positions</h3>
      <p className='text-center text-black dark:text-white font-lato pb-20'>Discover opportunities to grow your career with our innovative teams</p>
      {careers.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-3 gap-10 items-center">
          {careers.map((career) => (
            <CareerCard
              id={career.id}
              key={career.id}
              field={career.field}
              title={career.title}
              description={career.description}
              employment_type={career.employment_type}
              location={career.location}
              level={career.level}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-8 items-center justify-center text-black text-3xl">
          No Current Job Opening
        </div>
      )}
      {careers.length > 0 ? 
        <Button onClick={() => {route.push("/careers")}} className='self-center my-[100px] py-6 px-10' >VIEW ALL OPENINGS</Button> 
          : 
        null 
      }
    </section>
  )
}



export default CareerSection;