import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { Button } from "@/components/ui/primitives";

import { websiteContent } from "@/lib/website-content";
import { ServiceContent } from "@/components/website-content";

export const metadata = { title: "Services | AgencyDesk" };
export default function Page() {
  return (
    <div className="marketing">
      <MarketingHeader />
      <main id="main-content">
        <section className="service-hero"><h1>Website and application services</h1><p>Example service offerings for the fictional agency in this portfolio project.</p></section>
        <section className="marketing-section public-service-list">
          {websiteContent.services.map(service => <ServiceContent key={service.id} service={service} />)}
          <div className="hero-actions"><Button asChild><Link href="/inquire">Start inquiry</Link></Button><Link href="/demo">View workspace demo</Link></div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
