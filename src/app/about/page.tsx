import AboutUsHero from "@/sections/about/aboutus-hero";
import KPISection from "@/sections/about/kpi-section";
import OverviewSection from "@/sections/about/overview-section";
import MissionVisionSection from "@/sections/about/mission-vision-section";
import { ContactSection } from "@/sections/contact-section";
import { getSEOMetadata } from "@/utils/seoMetadata";
import FaqSection from "@/sections/about/faq-section";
import Snaps from "@/sections/about/snaps";


export async function generateMetadata() {
  return getSEOMetadata("citc-ph.com", "/about");
}


export default async function AboutPage() {

  return (
    <div className="lg:min-h-screen flex flex-col scroll-smooth overflow-hidden radial-gradient-bg">
      <AboutUsHero />
      <KPISection />
      <OverviewSection />
      <MissionVisionSection />
      <Snaps />
      <FaqSection />
      <ContactSection />
    </div>
  );
}