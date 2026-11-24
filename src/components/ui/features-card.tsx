import React from 'react'
import Link from 'next/link'

type Props = {
  title: string
  description: string
  icon?: string | React.ReactNode
  variant?: 'default' | 'secondary'
  link?: string
}

const FeaturesCard = (props: Props) => {
  const { variant = 'default', link } = props;
  
  // Define variant styles
  const variantStyles = {
    default: "bg-[#ff7976]/20 border-[#ff797680] dark:bg-[#4A1C1D]/80 dark:border-[#7A131F]",
    secondary: "bg-black/10 border-black/20 dark:bg-white/10 dark:border-white/20"
  };

  const cardContent = (
    <div 
      className={`
        flex flex-col justify-between items-center 
        gap-4 sm:gap-5
        rounded-2xl sm:rounded-3xl
        p-6 sm:p-7 xl:p-8
        text-center 
        ${variantStyles[variant]} 
        border
        w-full
        max-w-[26rem] sm:max-w-[28rem]
        min-h-[14rem] sm:min-h-[15.5rem]
        h-full
        hover:border-opacity-80
        ${link ? "hover:scale-[1.02] active:scale-[0.98] cursor-pointer hover:border-primary/80" : ""}
        transition-[transform,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]
        shadow-[inset_0_0_10px_0_rgba(255,255,255,0.1)]
        dark:shadow-[inset_0_0_4px_0_rgba(255,255,255,0.25)]
      `}
    >
      {/* Icon Container */}
      <div 
        className="
          flex justify-center items-center 
          w-[clamp(4rem,2vw,5rem)] 
          h-[clamp(4rem,2vw,5rem)]
          shrink-0
          transition-transform duration-300
        "
      >
        {typeof props.icon === 'string' ? (
          // Use native img to satisfy testing-library getByRole('img') expectations
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={props.icon} 
            alt={props.title} 
            className="w-full h-full object-contain"
          />
        ) : (
          props.icon
        )}
      </div>

      {/* Title */}
      <h3 
        aria-label={props.title}
        className="
          text-[clamp(1rem,1.5vw,1.875rem)]
          font-bold 
          font-montserrat 
          leading-tight
        "
      >
        {props.title}
      </h3>

      {/* Description */}
      <p 
        aria-label={props.description}
        className="
          text-[clamp(0.875rem,1.8vw,1rem)]
          font-lato 
          text-black dark:text-[#CCC] 
          leading-relaxed
        "
      >
        {props.description}
      </p>
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="w-full flex justify-center group h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

export default FeaturesCard