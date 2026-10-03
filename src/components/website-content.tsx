import Link from 'next/link';
import type { WebsiteContent } from '@/lib/website-schema';

export function ServiceContent({ service }: { service: WebsiteContent['services'][number] }) {
  return <article><h2>{service.title}</h2><p>{service.description}</p><ul>{[service.bullet_1, service.bullet_2, service.bullet_3].map((bullet, index) => <li key={index}>{bullet}</li>)}</ul></article>;
}
const destinations = { portal: { href: '/demo/portal', action: 'View client project' }, proposals: { href: '/demo/proposals', action: 'View proposal' }, leads: { href: '/demo/leads', action: 'View lead pipeline' } };
export function SampleProjectContent({ project }: { project: WebsiteContent['sample_projects'][number] }) {
  const destination = destinations[project.scenario];
  return <article><div><h2>{project.title}</h2><p className="muted">{project.service}</p></div><p>{project.description}</p><Link href={destination.href}>{destination.action}</Link></article>;
}
export function HomeFeatures({ home }: { home: WebsiteContent['home_page'] }) {
  return <section className="marketing-section"><div className="section-heading"><h2>{home.section_heading}</h2></div><div className="public-feature-list">
    <article><h3>{home.leads_heading}</h3><p>{home.leads_description}</p><Link href="/demo/leads">View lead pipeline</Link></article>
    <article><h3>{home.proposals_heading}</h3><p>{home.proposals_description}</p><Link href="/demo/proposals">View proposals</Link></article>
    <article><h3>{home.portal_heading}</h3><p>{home.portal_description}</p><Link href="/demo/portal">View client portal</Link></article>
  </div></section>;
}
