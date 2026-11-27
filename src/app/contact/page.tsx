import ContactUsHero from "@/sections/contact/contact-us-hero";
import NewLetterSection from "@/sections/home/newsletter-section";
import { getSEOMetadata } from "@/utils/seoMetadata";

export async function generateMetadata() {
  return getSEOMetadata("agencydesk-theta.vercel.app", "/contact");
}

export default function ContactPage() {
  return (
    <>
      <ContactUsHero />
      <NewLetterSection />
    </>
  );
}
