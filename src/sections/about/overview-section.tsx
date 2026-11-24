"use client"
import Image from 'next/image'
import React from 'react'

const OverviewSection = () => {
  return (
    <div className="flex flex-col gap-24 justify-center items-center py-10 px-5 lg:py-[200px] lg:px-[200px] backdrop-blur-2xl">
      <div className="
        flex 
        flex-col 
        gap-12.5 
        justify-center 
        p-12.5 
        lg:p-25 
        rounded-[3.125rem] 
        shadow-[0_0_20px_0_rgba(0,0,0,0.10),inset_0_0_20px_0_rgba(255,255,255,0.80)] 
        dark:shadow-[0_0_20px_0_rgba(0,0,0,0.10),inset_0_0_20px_0_rgba(255,255,255,0.2)] 
        border 
        border-white 
        dark:border 
        dark:border-white/10 
        w-full
        ">
        <div className="flex flex-col justify-center">
          <Image className='self-center block dark:hidden w-[clamp(15rem,4vw,20rem)]' src="/logo/wordmark-light.svg" alt="AgencyDesk Logo" width={220} height={56} />
          <Image className='self-center hidden dark:block w-[clamp(15rem,4vw,20rem)]' src="/logo/wordmark-dark.svg" alt="AgencyDesk Logo" width={220} height={56} />
        </div>
        <article className="text-center font-lato font-medium text-[#141414] dark:text-muted-foreground text-[clamp(16px,2vw,24px)]">
          AgencyDesk is the modern digital workspace and CRM engineered specifically for forward-thinking creative, software, and marketing agencies. We replace fragmented tools with unified lead capture, transparent fixed-scope agreements, and automated sprint execution.
          <br/>
          <br/>
          <span className="font-bold text-gray-900 dark:text-white">Our Core Pillars</span>
          <ul className="list-disc list-inside my-4 text-left max-w-2xl mx-auto space-y-2">
            <li><strong>Lead-to-Project Continuity:</strong> Convert inquiries seamlessly into weighted pipeline deals and active sprint milestones.</li>
            <li><strong>Zero Surprise Invoicing:</strong> Immutable, versioned proposals with signed change orders eliminate scope creep.</li>
            <li><strong>Client Transparency Portal:</strong> Clients monitor live sprint burndown, review artifacts, and sign off in real time.</li>
            <li><strong>Deterministic Automations:</strong> Transactional outbox pattern guarantees webhook and CRM notification delivery without duplicates.</li>
            <li><strong>Enterprise Agency Isolation:</strong> Strict multi-tenant data boundaries protect client confidentiality across all pods.</li>
          </ul>
          <br/>
          <span className="font-bold text-gray-900 dark:text-white">What We Deliver</span>
          <p className="mt-3 text-base sm:text-lg">
            We empower agencies to operate with institutional rigor, predictable margins, and delight clients from first pitch to final deployment.
          </p>
        </article>
      </div>
    </div>
  )
}

export default OverviewSection