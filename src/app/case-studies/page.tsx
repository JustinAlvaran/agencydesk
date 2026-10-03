import { websiteContent } from "@/lib/website-content";
import { SampleProjectContent } from "@/components/website-content";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";

export const metadata = { title: "Sample projects | AgencyDesk" };
export default function Page() {
  return (
    <div className="marketing">
      <MarketingHeader />
      <main id="main-content">
        <section className="service-hero"><h1>Sample projects</h1><p>Fictional scenarios showing how inquiries, proposals, and client projects move through the workspace.</p></section>
        <section className="marketing-section public-project-list">
          {websiteContent.sample_projects.map(project => <SampleProjectContent key={project.id} project={project} />)}
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
