import Image from 'next/image'
import React from 'react'

const Snaps = () => {
  return (
    <section className="flex flex-col justify-center gap-10 items-center py-10 px-5 lg:px-[100px] lg:py-[100px] bg-transparent backdrop-blur-2xl">
        <div className="flex flex-col gap-5 justify-center items-center py-5">
          <h2 className="text-3xl text-center font-bold font-monserrat text-black dark:text-white">Our Agency Snaps</h2>
          <p className="text-[0.875rem] text-black text-center  dark:text-gray-300">Experienced professionals dedicated to your success</p>
        </div>
        <div className="flex flex-row flex-wrap justify-center items-center gap-10">
          <Image src="/snaps/1.webp" alt="Snap 1" width={500} height={500} className="rounded-[20px] sm:h-65 lg:min-h-[528px] lg:min-w-[800px] object-cover" />
          <Image src="/snaps/2.webp" alt="Snap 2" width={500} height={500} className="rounded-[20px] sm:h-90 lg:min-h-[528px] h-[528px] object-cover" />
          <Image src="/snaps/3.webp" alt="Snap 3" width={500} height={500} className="rounded-[20px] sm:h-65 lg:min-h-[528px] h-[528px] lg:min-w-[500px] object-cover" />
          <Image src="/snaps/4.webp" alt="Snap 4" width={500} height={500} className="rounded-[20px] sm:h-90 lg:min-h-[528px] lg:min-w-[800px] object-cover" />
          <Image src="/snaps/5.webp" alt="Snap 5" width={500} height={500} className="rounded-[20px] sm:h-65 lg:min-h-[528px] h-[528px] lg:min-w-[800px] object-cover" />
          <Image src="/snaps/6.webp" alt="Snap 6" width={500} height={500} className="rounded-[20px] sm:h-90 lg:min-h-[528px] lg:min-w-[500px] object-cover" />
        </div>
    </section>
  )
}

export default Snaps