import React from 'react'
import ServiceDetailSection from '@/sections/services/service-detail-section'
import WhyChooseUs from '@/sections/services/why-choose-us'
import OurServicesSection from '@/sections/services/our-services-section'
import { ContactSection } from '@/sections/contact-section'
import FourStageProcess from '@/sections/services/4-stage-process'
import { getServiceDetailSSG } from '@/utils/getServiceDetailSSG'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const serviceDetail = await getServiceDetailSSG('web-and-mobile-development');
  
  return {
    title: `${serviceDetail.heroTitle} | AgencyDesk`,
    description: serviceDetail.heroSubtitle,
    openGraph: {
      title: serviceDetail.heroTitle,
      description: serviceDetail.heroSubtitle,
      images: serviceDetail.main_image ? [serviceDetail.main_image] : [],
    },
  };
}

export default async function WebAndMobileDevelopmentPage() {
  const serviceDetail = await getServiceDetailSSG('web-and-mobile-development');

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
