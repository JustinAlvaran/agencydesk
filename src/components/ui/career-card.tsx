"use client"
import React from 'react'
import { MdWork, MdAccessTime, MdOutlineLocationOn } from 'react-icons/md';
import { LuTarget } from 'react-icons/lu';
import { FaArrowRight } from 'react-icons/fa';
import { Button } from './button';
import { useRouter } from 'next/navigation';
import { Career } from '@/types/careers';

type Props = {
  id: string;
  field: string;
  title: string;
  description: string;
  employment_type: string;
  location: string;
  level: string;
  image?: string | { id: string };
  link?: string;
  isCarousel?: boolean;
  onApply?: (jobId: string) => void;
}

const CareerCard = (props: Props) => {
  const descriptionText = props.description || '';
  const router = useRouter();

  const descriptionWords = descriptionText.split(' ');
  const limitedDescription = descriptionWords.length > 14
    ? descriptionWords.slice(0, 14).join(' ') + '...'
    : descriptionText;

  return (
    <div 
      className={`
        flex flex-col justify-between items-start 
        bg-white/60 dark:bg-white/20 
        border-2 border-white/10 dark:border-white/5 
        backdrop-blur-3xl 
        rounded-[clamp(30px,5vw,3.125rem)]
        transition-all duration-500 
        hover:border-red-500 hover:shadow-xl
        drop-shadow
        ${props.isCarousel 
          ? 'w-full min-w-[min(20rem,90vw)] max-w-116' 
          : 'w-[clamp(340px,780px)] max-w-185 3xl:min-w-[780px]'
        }
        p-[clamp(2.5rem,2vw,3.125rem)]
        gap-[clamp(1.25rem,3vw,2rem)]
        shadow-[0_4px_20px_0_rgba(0,0,0,0.10),inset_0_0_20px_0_rgba(255,255,255,0.05)]
        h-full
        w-full
        max-w-[clamp(25rem,45vw,48.75rem)]
        max-h-[clamp(20.25rem,45vw,32.125rem)]
        3xl:max-w-195
        3xl:max-h-88.5
      `}
    >
      <div className="flex flex-col justify-center items-start gap-5 flex-[1_0_0]">
        <div className="flex flex-row gap-2 items-center">
          <MdWork color="red" className="w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)] shrink-0" />
          <p className="font-lato text-gray-700 dark:text-white text-[clamp(0.875rem,1.5vw,1rem)] leading-relaxed">
            {props.field.length > 0 ? props.field : "N/A"}
          </p>
        </div>
        <div className="flex flex-col gap-[clamp(0.75rem,2vw,1.25rem)] justify-between flex-1 max-w-80 xl:max-w-175 w-full">
          <h3 className="font-semibold text-[clamp(1.25rem,3.5vw,1.875rem)] text-start leading-tight line-clamp-1">
            {props.title || "N/A"}
          </h3>
          
          <p className="font-lato text-gray-700 dark:text-white text-[clamp(0.875rem,1.5vw,1rem)] leading-relaxed md:line-clamp-1">
            {limitedDescription.length > 0 ? limitedDescription : "N/A"}
          </p>
        </div>
        
        <div className="flex flex-row flex-wrap gap-[clamp(0.75rem,2vw,2rem)] justify-start items-center w-full">
          <span className="flex flex-row gap-2 items-center">
            <MdAccessTime 
              color="red" 
              className="w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)] shrink-0"
            />
            <p className="font-lato text-gray-700 dark:text-white text-[clamp(0.75rem,1.5vw,0.875rem)] whitespace-nowrap">
              {props.employment_type.length > 0 ? props.employment_type : "N/A"}
            </p>
          </span>
          
          <span className="flex flex-row gap-2 items-center">
            <MdOutlineLocationOn 
              color="red" 
              className="w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)] shrink-0"
            />
            <p className="font-lato text-gray-700 dark:text-white text-[clamp(0.75rem,1.5vw,0.875rem)] whitespace-nowrap">
              {props.location.length > 0 ? props.location : "N/A"}
            </p>
          </span>
          
          <span className="flex flex-row gap-2 items-center">
            <LuTarget 
              color="red" 
              className="w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)] shrink-0"
            />
            <p className="font-lato text-gray-700 dark:text-white text-[clamp(0.75rem,1.5vw,0.875rem)] whitespace-nowrap">
              {props.level.length > 0 ? props.level : "N/A"}
            </p>
          </span>
        </div>
        
        <div className="flex flex-row gap-[clamp(0.75rem,2vw,1rem)] pt-5 w-full sm:w-auto">
          <Button
            className="
              h-[clamp(2.5rem,5vw,2.9375rem)]
              px-[clamp(0.625rem,1vw,1.5rem)]
              text-[clamp(0.75rem,1.5vw,0.875rem)]
              font-medium
              min-w-fit
              whitespace-nowrap
              flex-1 sm:flex-initial
              sm:w-37.5
            "
            onClick={() => props.onApply?.(props.id)}
          >
            APPLY NOW
            <FaArrowRight color="white" className="ml-2 w-[clamp(0.875rem,1.5vw,1.25rem)] h-[clamp(0.875rem,1.5vw,1.25rem)]" />
          </Button>
          
          <Button
            onClick={() => router.push(`/careers/job-details/${(props as Career).id}`)}
            variant="secondary"
            className="
              h-[clamp(2.5rem,5vw,2.9375rem)]
              px-[clamp(0.625rem,3vw,1.5rem)]
              text-[clamp(0.75rem,1.5vw,0.875rem)]
              font-medium
              min-w-fit
              whitespace-nowrap
              flex-1 sm:flex-initial
              sm:w-37.5
              sm:max-w-150
              w-[clamp(8rem,30vw,12.5rem)]
            "
          >
            JOB DETAILS
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CareerCard;