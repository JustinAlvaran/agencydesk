import {PublicTheme} from '@/components/public-theme';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarketingFooter, MarketingHeader } from '@/components/marketing';
import { publicServices } from '@/lib/website-content';

export const dynamicParams = false;
export function generateStaticParams() { return publicServices.map(service => ({ slug: service.id })); }

async function serviceFor(params: Promise<{ slug: string }>) {
  const { slug } = await params;
  const service = publicServices.find(item => item.id === slug);
  if (!service) notFound();
  return service;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const service = await serviceFor(params);
  return { title: service.title, description: service.description, alternates: { canonical: `/services/${service.id}` }, openGraph: { title: service.title, description: service.description, url: `/services/${service.id}`, type: 'website' } };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const service = await serviceFor(params);
  return <PublicTheme><MarketingHeader/><main id="main-content">
    <section className="service-hero"><Link href="/services" className="record-back">All services</Link><h1>{service.title}</h1><p>{service.description}</p><div className="hero-actions"><Link className="button button-primary" href={`/inquire?service=${service.id}`}>Discuss {service.title.toLowerCase()}</Link></div></section>
    <section className="marketing-section public-service-list" aria-label="Service scope">
      <article><h2>What we can include</h2><ul>{[service.bullet_1,service.bullet_2,service.bullet_3].map((bullet,index)=><li key={index}>{bullet}</li>)}</ul><p>The final deliverables, timeline, revisions, and price are agreed in your proposal. Third-party subscriptions, hosting upgrades, and messaging charges are scoped separately when needed.</p></article>
      <article><h2>From brief to delivery</h2><ol className="service-process"><li><strong>Share your requirements.</strong> Tell us what you need, what already exists, and your preferred timeline.</li><li><strong>Review the proposal.</strong> Agree on deliverables and pricing before accepting the scope.</li><li><strong>Follow the milestones.</strong> Use your private client portal for agreed project updates.</li><li><strong>Plan the handover.</strong> Confirm launch access, documentation, and any ongoing support in the proposal.</li></ol></article>
      <article><h2>What to include in your inquiry</h2><p>Describe your main goal, your current website or tools, any integrations you need, your budget range, and your target launch date. If you are unsure of the technical approach, describe the outcome you want.</p><Link className="button button-primary" href={`/inquire?service=${service.id}`}>Start a project inquiry</Link></article>
    </section>
  </main><MarketingFooter/></PublicTheme>;
}
