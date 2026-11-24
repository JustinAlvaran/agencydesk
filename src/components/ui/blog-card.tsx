import Link from 'next/link'
import React from 'react'

type Props = {
  title: string
  tag: string
  date: string | Date
  link: string
  image?: string
}

const BlogCard = (props: Props) => {
  return (
    <div className="flex flex-col justify-center ">
      
      <div className="flex flex-col gap-5 lg:px-8 py-[30px]">
        <div className="flex flex-row gap-2">
          <p className="rounded-full px-1 py-2 bg-red-500 text-white text-center text-md">{props.tag.toUpperCase()}</p>
          <p>{typeof props.date === 'string' ? props.date : new Date(props.date).toLocaleDateString()}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {props.image && <img src={props.image} alt={props.title} />}
        <title>{props.title}</title>
        <Link href={props.link}>Read More</Link>
        
      </div>
    </div>
  )
}

export default BlogCard