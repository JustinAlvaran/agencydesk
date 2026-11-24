"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

const PrivacyPolicyHero = () => {
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-card/70 px-6 py-5 rounded-xl border mb-8 flex items-center gap-6 justify-between shadow-[0_4px_20px_0_rgba(0,0,0,0.10),inset_0_0_20px_0_rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-4">
            <div
                className="w-14 h-14 rounded-lg flex items-center justify-center"
                style={{ background: "var(--primary)" }}
            >
                <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Policy</p>
                <h2 className="text-2xl lg:text-3xl font-bold" style={{ color: "var(--primary)" }}>
                    Privacy & Security
                </h2>
                <p className="text-sm text-muted-foreground">How we collect, use and safeguard your information.</p>
            </div>
        </div>
    </motion.div>
  )
}

export default PrivacyPolicyHero
