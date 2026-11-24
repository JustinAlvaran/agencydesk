import JoinUsForm from '@/components/forms/joinus-form'
import React from 'react'

const JoinUsSection = () => {
  return (
    <section id="joinus" className="flex flex-col gap-4 justify-center items-center py-[100px] joinus-bg lg:h-full min-h-[1868px] bg-white dark:bg-dark">
      <div className="flex flex-col gap-4 py-10">
        <h4 className="text-center font-semibold text-5xl">Apply Now</h4>
        <p className="font-lato text-center text-gray-600 dark:text-white text-sm lg:text-lg">Tell us about yourself and let&apos;s start the conversation</p>
      </div>
      <JoinUsForm />
    </section>
  )
}

export default JoinUsSection