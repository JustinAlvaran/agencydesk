import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Plus } from 'lucide-react';
import { publicServices, websiteContent } from '@/lib/website-content';
import { MarketingHeader, MarketingFooter } from './marketing';
import { PublicTheme } from './public-theme';
import { AgencyWorld } from './diorama-world-view';
import { WatchWorkflow } from './launch-effects';
import styles from '@/app/home.module.css';

export function AgencyHome() {
  const home = websiteContent.home_page;
  const steps = [
    { title: home.leads_heading, copy: home.leads_description, href: '/demo/leads', action: 'View lead pipeline' },
    { title: home.proposals_heading, copy: home.proposals_description, href: '/demo/proposals', action: 'View proposals' },
    { title: home.portal_heading, copy: home.portal_description, href: '/demo/portal', action: 'View client portal' },
  ];

  return (
    <PublicTheme className={styles.page}>
      <MarketingHeader />
      <main id="main-content">
        <section className={styles.hero} aria-labelledby="home-title" data-world-step="studio">
          <div className={styles.introduction}>
            <h1 id="home-title">{home.heading}</h1>
            <p>{home.description}</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/inquire">Discuss your project<ArrowUpRight size={16} aria-hidden /></Link>
              <WatchWorkflow />
            </div>
          </div>
          <div className={styles.illustration}><AgencyWorld /></div>
        </section>

        <section className={styles.services} aria-labelledby="services-title" data-world-step="intake">
          <header className={styles.heading}>
            <h2 id="services-title">Services</h2>
            <Link href="/services">Explore services<ArrowUpRight size={16} aria-hidden /></Link>
          </header>
          <div className={styles.serviceList}>
            {publicServices.map(service => (
              <article key={service.id}>
                <h3><Link href={`/services/${service.id}`}>{service.title}</Link></h3>
                <p>{service.description}</p>
                <Link className={styles.serviceLink} href={`/services/${service.id}`} aria-label={`Explore scope: ${service.title}`}>Explore scope<ArrowUpRight size={16} aria-hidden /></Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.workflow} id="workflow" aria-labelledby="workflow-title" data-world-step="assembly">
          <div>
            <h2 id="workflow-title">From first hello to final handoff.</h2>
            <p>{home.section_heading}</p>
            <Link className={styles.primary} href="/demo">Open workspace demo<ArrowUpRight size={16} aria-hidden /></Link>
          </div>
          <div className={styles.steps}>
            {steps.map(step => (
              <article key={step.href}>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
                <Link href={step.href}>{step.action}<ArrowRight size={16} aria-hidden /></Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.previewSection} data-world-step="preview">
          <header className={styles.heading}>
            <h2>One workspace for delivery</h2>
            <Link href="/demo/design">Explore the empty interface<ArrowUpRight size={16} aria-hidden /></Link>
          </header>
          <section className={styles.preview} aria-label="AgencyDesk workflow preview">
            <div className={styles.previewHeader}><strong>Lead pipeline</strong><span>Interface preview</span></div>
            <div className={styles.previewColumns}>
              {['New inquiry', 'Qualified', 'Proposal'].map(stage => (
                <div key={stage}><h3>{stage}</h3><p>No leads</p></div>
              ))}
            </div>
            <p className={styles.previewNote}>Empty interface preview. No records shown.</p>
          </section>
        </section>

        <section className={styles.guide} aria-labelledby="guide-title" data-world-step="guide">
          <h2 id="guide-title">Working together</h2>
          <div>{steps.map(step => (
            <details key={step.href}>
              <summary>{step.title}<Plus size={16} aria-hidden /></summary>
              <p>{step.copy}</p>
              <Link href={step.href}>{step.action}<ArrowUpRight size={16} aria-hidden /></Link>
            </details>
          ))}</div>
        </section>

        <section className={styles.closing} data-world-step="closing">
          <div><h2>Tell us what you’re building</h2><p>Share your requirements, budget, and timeline.</p></div>
          <Link className={styles.primary} href="/inquire">Start inquiry<ArrowUpRight size={16} aria-hidden /></Link>
        </section>
      </main>
      <MarketingFooter />
    </PublicTheme>
  );
}
