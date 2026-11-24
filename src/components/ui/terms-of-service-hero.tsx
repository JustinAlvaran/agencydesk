"use client"
import React from 'react'
import { FaGavel } from 'react-icons/fa'
import { motion } from 'framer-motion'

export default function TermsOfServiceHero({ title = 'Terms of Service' }: { title?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-card/70 p-6 rounded-xl border mb-8 flex flex-col md:flex-row items-start gap-6 shadow-[0_4px_20px_0_rgba(0,0,0,0.10),inset_0_0_20px_0_rgba(255,255,255,0.05)]">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
          <FaGavel className="text-white w-6 h-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Legal</p>
          <h1 className="text-3xl lg:text-4xl font-bold mt-1" style={{ color: 'var(--primary)' }}>{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Last updated: July 1, 2025</p>
        </div>
      </div>
    </motion.div>
  )
}
