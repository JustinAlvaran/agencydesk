"use client";

import React from "react";
import CTAButton from "@/components/ui/cta-button";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { HiOutlineSparkles } from "react-icons/hi2";
import { IoDocumentTextOutline } from "react-icons/io5";
import { RiRocketLine } from "react-icons/ri";

const Hero = () => {
  return (
    <section
      id="hero"
      data-testid="hero"
      className="flex flex-col justify-center items-center text-center hero-bg
      gap-[clamp(1.75rem,2.5vw,2.5rem)]
      pt-[clamp(7rem,12vw,11rem)]
      pb-[clamp(3rem,6vw,5rem)]
      px-[clamp(1rem,5vw,5rem)]
      transition-all duration-300 ease-in-out
      w-full"
    >
      {/* Top Eyebrow Badge */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 backdrop-blur-md"
      >
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Agency Operating System &amp; Client Portal
        </span>
      </motion.div>

      {/* Main Headline */}
      <motion.h1
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.1 }}
        className="
          font-bold 
          text-black 
          dark:text-[#F3F4F6]
          leading-tight 
          drop-shadow-sm
          text-[clamp(2.25rem,5.5vw,4.75rem)]
          max-w-4xl
          mx-auto
        "
      >
        Next-Gen <span className="text-primary">Agency CRM</span> &amp; Digital{" "}
        <span className="text-primary">Workspace</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.2 }}
        className="
          font-montserrat
          font-medium
          leading-relaxed
          text-gray-600 
          dark:text-gray-300
          text-[clamp(0.95rem,1.25vw,1.25rem)]
          max-w-2xl
          mx-auto
        "
      >
        AgencyDesk unites client lead capture, versioned scopes, agreed pricing, milestone delivery, and real-time CRM tracking into one seamless platform.
      </motion.p>

      {/* 3 Pillars Badges */}
      <div
        className="
          grid 
          grid-cols-1 
          sm:grid-cols-3
          gap-4
          py-2
          max-w-3xl
          w-full
        "
      >
        {[
          {
            icon: <HiOutlineSparkles className="w-5 h-5 text-primary" />,
            title: "Capture & Qualify",
            desc: "Inbound briefs, lead scoring & CRM outbox",
            link: "/crm/leads",
          },
          {
            icon: <IoDocumentTextOutline className="w-5 h-5 text-primary" />,
            title: "Scope & Agree",
            desc: "Versioned pricing, itemized scopes & e-sign",
            link: "/crm/proposals",
          },
          {
            icon: <RiRocketLine className="w-5 h-5 text-primary" />,
            title: "Deliver & Scale",
            desc: "Client portal milestones & progress telemetry",
            link: "/portal",
          },
        ].map((item, i) => (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 + i * 0.15 }}
            key={i}
            className="w-full"
          >
            <Link
              href={item.link}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-gray-200/80 dark:border-zinc-800 text-left shadow-sm hover:border-primary/80 hover:bg-white/80 dark:hover:bg-zinc-900 hover:scale-[1.02] transition-all duration-200 group block"
            >
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shrink-0 group-hover:bg-primary/20 transition-colors">
                {item.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider group-hover:text-primary transition-colors">
                  {item.title} ↗
                </p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                  {item.desc}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Call to Actions */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.7 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3"
      >
        <CTAButton
          title="Start inquiry"
          link="/inquire"
          className="shadow-lg shadow-primary/25"
        />

        <Link
          href="/crm"
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full
            px-6 py-3.5 font-semibold text-xs uppercase tracking-wider
            bg-white/80 dark:bg-zinc-900/80 text-gray-900 dark:text-white
            border border-gray-300 dark:border-zinc-700
            hover:border-primary/80 hover:text-primary
            backdrop-blur-md shadow-sm hover:shadow-md
            transition-[transform,border-color,color,box-shadow] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]
            active:scale-[0.96]"
        >
          {/* Subtle top specular line */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
          <span className="relative z-10">Explore CRM Workspace</span>
          <span
            aria-hidden="true"
            className="relative z-10 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center overflow-hidden text-primary"
          >
            <ArrowRightIcon className="absolute h-3.5 w-3.5 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-3.5 group-hover:opacity-0" />
            <ArrowRightIcon className="absolute h-3.5 w-3.5 -translate-x-3.5 opacity-0 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0 group-hover:opacity-100" />
          </span>
        </Link>
      </motion.div>
    </section>
  );
};

export default Hero;
