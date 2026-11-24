import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getSEOMetadata } from '@/utils/seoMetadata'
import TermsOfServiceHero from '@/components/ui/terms-of-service-hero'

export async function generateMetadata() {
  return getSEOMetadata('citc-ph.com', '/terms-of-service')
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-red-50/30 dark:from-black dark:via-black dark:to-red-900/20 text-gray-900 dark:text-white px-4 py-16 lg:py-[150px]">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-100/20 via-white to-red-200/20 dark:from-red-900/10 dark:via-black dark:to-red-950/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-400/10 dark:bg-red-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 dark:bg-red-600/5 rounded-full blur-3xl"></div>
        </div>
      </div>

      <main className="relative z-10 max-w-5xl mx-auto text-left">
        <TermsOfServiceHero />

        {/* Content Card */}
        <article className="flex flex-col gap-4 prose prose-invert max-w-none bg-card/60 p-8 rounded-[clamp(1.25rem,4vw,1.875rem)] backdrop-blur-xl shadow-[0_4px_20px_0_rgba(0,0,0,0.10),inset_0_0_20px_0_rgba(255,255,255,0.05)]">
          <p>
            Welcome to Cornerstone International Technologies. These Terms of Service (&quot;Terms&quot;) govern your access to and use of our website and services. By accessing or using our services, you agree to be bound by these Terms.
          </p>

          <section className="mb-6  pl-4 rounded-sm" >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--primary)' }}>1. Acceptance of Terms</h3>
            <p>
              By using our services, you accept and agree to follow the terms and conditions outlined here. If you disagree with any part of these terms, you must not use our services.
            </p>
          </section>

          <section className="mb-6  pl-4 rounded-sm" >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--primary)' }}>2. Use of Service</h3>
            <p>Our services are provided for lawful purposes only. You agree not to use the services to upload, post, or otherwise transmit any content that is unlawful, harmful, offensive, or infringes the rights of others.</p>
          </section>

          <section className="mb-6  pl-4 rounded-sm" >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--primary)' }}>3. Accounts & Security</h3>
            <ul className="mt-3 space-y-2">
              <li className="flex gap-3 items-start"><span className="w-3 h-3 rounded-full mt-2" style={{ background: 'var(--primary)' }} aria-hidden></span><span>You are responsible for maintaining the confidentiality of your account credentials.</span></li>
              <li className="flex gap-3 items-start"><span className="w-3 h-3 rounded-full mt-2" style={{ background: 'var(--primary)' }} aria-hidden></span><span>Notify us immediately if you suspect unauthorized access to your account.</span></li>
            </ul>
          </section>

          <section className="mb-6  pl-4 rounded-sm" >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--primary)' }}>4. Intellectual Property</h3>
            <p>All content, trademarks, and intellectual property on this site are owned by or licensed to us. You may not use any of our content without prior written permission.</p>
          </section>

          <section className="mb-6  pl-4 rounded-sm" >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--primary)' }}>5. Third-Party Services</h3>
            <p>We may use third-party services that collect, store, and process data as described in our Privacy Policy. We are not responsible for the privacy practices or policies of those third parties.</p>
          </section>

          <section className="mb-6  pl-4 rounded-sm" >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--primary)' }}>6. Termination</h3>
            <p>We reserve the right to suspend or terminate access to our services for users who violate these Terms or for any reason at our discretion.</p>
          </section>

          <section className="mb-6  pl-4 rounded-sm" >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--primary)' }}>7. Governing Law</h3>
            <p>These Terms are governed by the laws of the Philippines, without respect to its conflict of laws rules.</p>
          </section>

          <section className="mb-6  pl-4 rounded-sm" >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--primary)' }}>8. Changes to Terms</h3>
            <p>We may update these Terms from time to time. If we make changes, we will update the effective date and post the updated Terms on this page.</p>
          </section>

          <section className="mb-6  pl-4 rounded-sm" >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--primary)' }}>9. Contact Us</h3>
            <p>If you have questions about these Terms, contact us at <a className="underline" href="mailto:privacy@citc-ph.com">privacy@citc-ph.com</a>.</p>
          </section>

          <div className="mt-6 flex items-center gap-4">
            <Link href="/privacy-policy">
              <Button variant="link">See our Privacy Policy</Button>
            </Link>
          </div>
        </article>
      </main>

      {/* Floating/Decorative Elements (static) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/6 w-8 h-8 bg-red-400/20 dark:bg-red-500/20 rounded-lg" />
        <div className="absolute bottom-1/3 right-1/6 w-6 h-6 bg-red-500/20 dark:bg-red-400/20 rounded-full" />
      </div>
    </div>
  )
}
