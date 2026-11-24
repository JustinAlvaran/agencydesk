import ServiceDetailSection from "@/sections/services/service-detail-section"
import WhyChooseUs from "@/sections/services/why-choose-us"
import FourStageProcess from "@/sections/services/4-stage-process"
import OurServicesSection from "@/sections/services/our-services-section"
import { ContactSection } from "@/sections/contact-section"
import { getServiceDetailSSG } from '@/utils/getServiceDetailSSG'
import { getSEOMetadata } from "@/utils/seoMetadata";

export async function generateMetadata() {
  return getSEOMetadata("citc-ph.com", "/services/cloud-hosting")
}
import React from 'react'

export default async function CloudHostingPage() {
  const serviceDetail = await getServiceDetailSSG('cloud-hosting');

  return (
    <div className='bg-transparent radial-gradient-bg'>
      <ServiceDetailSection serviceDetail={serviceDetail} />
      <WhyChooseUs />
      <FourStageProcess />
      <OurServicesSection />
      <ContactSection />
    </div>
  )
}
