import {PublicTheme} from '@/components/public-theme';
import { websiteContent } from "@/lib/website-content";
import { SampleProjectContent } from "@/components/website-content";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";

export const metadata = { title: "Sample projects", description: "Illustrative website, application, and client portal scenarios. Explore how AgencyDesk handles inquiries, proposals, and project delivery.", alternates: { canonical: '/case-studies' } };
export default function Page() {
  return (
    <PublicTheme>
      <MarketingHeader />
      <main id="main-content">
        <section className="service-hero"><h1>Sample projects</h1><p>Fictional scenarios showing how inquiries, proposals, and client projects move through the workspace.</p></section>
        <section className="marketing-section public-project-list">
          {websiteContent.sample_projects.map(project => <SampleProjectContent key={project.id} project={project} />)}
        </section>
      </main>
      <MarketingFooter />
    </PublicTheme>
  );
}
