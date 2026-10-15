import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { Button } from "@/components/ui/primitives";

import { publicServices } from "@/lib/website-content";
import { ServiceContent } from "@/components/website-content";

export const metadata = { title: "Services", description: "Business websites, redesigns, web applications, client portals, and CRM automation. Explore the scope and start a project inquiry.", alternates: { canonical: '/services' } };
export default function Page() {
  return (
    <div className="marketing">
      <MarketingHeader />
      <main id="main-content">
        <section className="service-hero"><h1>Digital services for your next stage</h1><p>Build your website, improve an existing experience, or connect the systems behind your business. Start with a project brief; agree on the scope and price before work begins.</p></section>
        <section className="marketing-section public-service-list">
          {publicServices.map(service => <div key={service.id}><ServiceContent service={service}/><div className="hero-actions"><Link className="button button-secondary" href={`/services/${service.id}`}>Explore {service.title.toLowerCase()}</Link><Link className="button button-primary" href={`/inquire?service=${service.id}`}>Discuss this service</Link></div></div>)}
          <div className="hero-actions"><Button asChild><Link href="/inquire">Start inquiry</Link></Button><Link href="/demo">View workspace demo</Link></div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
