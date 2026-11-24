import React from 'react'
import Link from "next/link"

interface SocialIconProps {
  icon: React.ReactNode;
  link: string;
  label?: string;
  ariaLabel?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  rel?: string;
}

const SocialIcon = ({ icon, link, label, ariaLabel, target, rel }: SocialIconProps) => {
  return (
    <>
      <div className='cursor-pointer flex flex-col gap-4 rounded-lg bg-primary dark:bg-primary hover:text-primary hover:bg-red-700 p-2 duration-300 transition-colors ease-in-out'>
        <Link href={link} target={target} rel={rel} aria-label={ariaLabel}>
          {icon}
        </Link>
        {label && <span>{label}</span>}
      </div>
    </>
  )
}

export default SocialIcon