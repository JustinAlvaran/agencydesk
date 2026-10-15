import Link from "next/link";
import { MarketingFooter, MarketingHeader, WorkflowPreview } from "@/components/marketing";
import { Button } from "@/components/ui/primitives";

import { publicServices, websiteContent } from "@/lib/website-content";
import { HomeFeatures } from "@/components/website-content";
export const metadata = { alternates: { canonical: '/' } };

export default function Home() {
  const home = websiteContent.home_page;
  return (
    <div className="marketing">
      <MarketingHeader />
      <main id="main-content">
        <section className="hero">
          <div className="hero-copy">
            <h1>{home.heading}</h1>
            <p>{home.description}</p>
            <div className="hero-actions">
              <Button asChild><Link href="/inquire">Discuss your project</Link></Button>
              <Button asChild variant="secondary"><Link href="/services">Explore services</Link></Button>
            </div>
            <p className="hero-footnote"><Link href="/demo">Explore the read-only workspace demo</Link> — no account required.</p>
          </div>
          <WorkflowPreview />
        </section>
        <section className="marketing-section"><div className="section-heading"><h2>Services</h2><p>Choose a starting point for your project.</p></div><div className="public-feature-list service-overview">{publicServices.map(service=><article key={service.id}><h3><Link href={`/services/${service.id}`}>{service.title}</Link></h3><p>{service.description}</p><Link href={`/services/${service.id}`}>Explore service</Link></article>)}</div></section>
        <HomeFeatures home={home} />
      </main>
      <MarketingFooter />
    </div>
  );
}
