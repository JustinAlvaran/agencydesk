import Hero from "@/sections/home/hero";
import { InfiniteMarquee } from "@/components/ui/infinity-marquee";
import FeaturesSection from "@/sections/home/features-section";
import CRMShowcaseSection from "@/sections/home/crm-showcase-section";
import ServicesSection from "@/sections/home/services-section";
import AboutUsSection from "@/sections/home/aboutus-section";
import BenefitsSection from "@/sections/home/benefits-section";
import CommunitySection from "@/sections/home/community-section";
import NewLetterSection from "@/sections/home/newsletter-section";

export const metadata = {
  title: "AgencyDesk · Modern Agency CRM & Client Workspace",
  description: "Capture client inquiries, publish versioned proposals, track project milestones, and automate team delivery with complete transparency.",
};

export default function Home() {
  return (
    <div className="radial-gradient-bg">
      <main className="font-montserrat bg-transparent flex flex-col items-center justify-items-center min-h-screen overflow-hidden">
        <Hero />
        <InfiniteMarquee />
        <CRMShowcaseSection />
        <FeaturesSection />
        <ServicesSection />
        <AboutUsSection />
        <BenefitsSection />
        <CommunitySection />
        <NewLetterSection />
      </main>
    </div>
  );
}
