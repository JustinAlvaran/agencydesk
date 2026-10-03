import Link from "next/link";
import { MarketingFooter, MarketingHeader, WorkflowPreview } from "@/components/marketing";
import { Button } from "@/components/ui/primitives";

import { websiteContent } from "@/lib/website-content";
import { HomeFeatures } from "@/components/website-content";

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
              <Button asChild><Link href="/demo">Explore the workspace</Link></Button>
              <Button asChild variant="secondary"><Link href="/inquire">Start inquiry</Link></Button>
            </div>
            <p className="hero-footnote">The demo is read-only and requires no account.</p>
          </div>
          <WorkflowPreview />
        </section>
        <HomeFeatures home={home} />
      </main>
      <MarketingFooter />
    </div>
  );
}
