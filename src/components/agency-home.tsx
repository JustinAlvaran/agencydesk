import Link from 'next/link';
import { ArrowUpRight, Plus, Monitor, PanelsTopLeft, AppWindow, Workflow } from 'lucide-react';
import { publicServices, websiteContent } from '@/lib/website-content';
import { MarketingHeader, MarketingFooter } from './marketing';
import { PublicTheme } from './public-theme';
import { AgencyWorld } from './diorama-world-view';
import { WatchWorkflow } from './launch-effects';
import { StudioPreview } from './studio-preview';
import { ConnectionsCarousel } from './connections-carousel';
import styles from '@/app/home.module.css';

const icons = [Monitor, PanelsTopLeft, AppWindow, Workflow];
const classes = (...names: string[]) => names.map(name => styles[name]).join(' ');
const questions = [
  ['Can you work with our existing website or systems?', 'Yes. We review what you already have and agree on what to retain, improve, or replace. Existing systems and access boundaries are part of discovery.'],
  ['How is a project priced?', 'After an initial conversation, the proposal defines deliverables, scope, pricing, and a timeline. Demo prices are fictional examples.'],
  ['What happens after launch?', 'Testing and handover are included in the agreed scope. Ongoing maintenance or additional support can be discussed in your proposal.'],
  ['What is the AgencyDesk workspace?', 'The workspace brings leads, proposals, delivery, and client collaboration together. The public demo contains fictional records.'],
];

export function AgencyHome() {
  const home = websiteContent.home_page;
  const steps = [
    {number:'01 / Discover', title:home.leads_heading, copy:home.leads_description},
    {number:'02 / Agree the scope', title:home.proposals_heading, copy:home.proposals_description},
    {number:'03 / Build & deliver', title:home.portal_heading, copy:home.portal_description},
  ];
  return <PublicTheme className={styles.page}>
    <MarketingHeader/>
    <main id="main-content">
      <section className={styles.hero} aria-labelledby="home-title" data-world-step="studio"><div className={styles.container}><div className={styles['hero-intro']}><div>
        <p className={styles['hero-kicker']}>Websites, applications & connected workflows</p>
        <h1 id="home-title">{home.heading}</h1>
        <p className={styles['hero-description']}>{home.description}</p>
        <div className={styles['hero-buttons']}><Link className={styles.primary} href="/inquire">Discuss your project<ArrowUpRight size={17} aria-hidden/></Link><WatchWorkflow/></div>
        <p className={styles['hero-caption']}>A clear scope. A shared workspace. A practical handover.</p></div><aside className={styles['hero-access']}><p className={styles.eyebrow}>THE AGENCYDESK WORKSPACE</p><h2>One place for <br/>what comes next.</h2><p>Keep conversations moving, proposals clear and clients in the loop.</p><ol><li><span>01</span>Capture the opportunity</li><li><span>02</span>Agree on the work</li><li><span>03</span>Deliver it together</li></ol><Link href="/demo">Explore the workspace<ArrowUpRight size={18} aria-hidden/></Link><p className={styles['access-signin']}>Already invited? <Link href="/login">Sign in</Link></p></aside></div>
        <div className={styles['connections-band']}><ConnectionsCarousel/></div>
        <StudioPreview/>
        <div className={styles['under-preview']}><span>From the next conversation to the final handoff.</span><Link href="/demo">Take a look inside<ArrowUpRight size={14} aria-hidden/></Link></div>
      </div></section>

      <section className={classes('container','services-section')} aria-labelledby="services-title" data-world-step="intake">
        <div className={styles['section-heading']}><div><p className={styles.eyebrow}>What we do</p><h2 id="services-title">Built for the way you work.</h2></div><Link href="/services">Explore services<ArrowUpRight size={15} aria-hidden/></Link></div>
        <div className={styles['service-grid']}>{publicServices.map((service,index)=>{const Icon=icons[index%icons.length];return <article className={styles['service-item']} key={service.id}><div className={styles['service-number']}><span>{String(index+1).padStart(2,'0')}</span><Icon size={18} aria-hidden/></div><h3>{service.title}</h3><p>{service.description}</p><Link href={'/services/'+service.id}>Explore scope<ArrowUpRight size={14} aria-hidden/></Link></article>;})}</div>
      </section>

      <section className={styles['process-band']} id="workflow" aria-labelledby="workflow-title" data-world-step="assembly">
        <div className={styles.container}><div className={styles['section-heading']}><div><p className={styles.eyebrow}>A clear path forward</p><h2 id="workflow-title">From first hello to final handoff.</h2></div></div><div className={styles['process-grid']}>{steps.map(step=><article key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.copy}</p></article>)}</div></div>
      </section>

      <section className={classes('container','work-section')} aria-labelledby="work-title" data-world-step="preview">
        <div className={styles['section-heading']}><div><p className={styles.eyebrow}>Built for both sides of the work</p><h2 id="work-title">A shared workspace. A clearer conversation.</h2><p className={styles['section-description']}>Your team manages the details. Your clients see the work you share with them.</p></div></div>
        <div className={styles['work-grid']}>
          <article><div className={styles['product-sample']}><div className={styles['sample-toolbar']}><PanelsTopLeft size={18} aria-hidden/><strong>Lead pipeline</strong><span>Illustrative view</span></div><div className={styles['sample-table']}><div><span>Opportunity</span><span>Next step</span></div><div><strong>Business website</strong><span>Discovery call</span></div><div><strong>Website refresh</strong><span>Scope review</span></div><div><strong>Client portal</strong><span>Proposal</span></div></div><p>Every conversation has a next step.</p></div><div className={styles['work-caption']}><div><h3>For your team</h3><p>Leads, tasks, proposals and project delivery.</p></div><Link href="/demo/leads">Explore pipeline<ArrowUpRight size={15} aria-hidden/></Link></div></article>
          <article><div className={classes('product-sample','client-sample')}><div className={styles['sample-toolbar']}><AppWindow size={18} aria-hidden/><strong>Client workspace</strong><span>Illustrative view</span></div><div className={styles['sample-project']}><span>YOUR PROJECT</span><h3>Website refresh</h3><p>A shared view of the next milestone.</p><div><span>Discovery</span><strong>Design review</strong><span>Build</span></div></div><p>A focused space for the work you share.</p></div><div className={styles['work-caption']}><div><h3>For your clients</h3><p>Shared proposals, progress and milestones.</p></div><Link href="/demo/portal">Explore portal<ArrowUpRight size={15} aria-hidden/></Link></div></article>
        </div>
      </section>
      <section className={classes('container','faq-section')} aria-labelledby="guide-title" data-world-step="guide">
        <div><p className={styles.eyebrow}>Before we begin</p><h2 id="guide-title">A few good questions.</h2><p className={styles['section-description']}>Bring the questions. We will work through the requirements together.</p></div><div className={styles['faq-list']}>{questions.map(([question,answer])=><details key={question}><summary>{question}<Plus size={16} aria-hidden/></summary><p>{answer}</p></details>)}</div>
      </section>

      <section className={classes('container','world-section')} aria-labelledby="world-title"><div><p className={styles.eyebrow}>Explore the process</p><h2 id="world-title">The workspace, layer by layer.</h2><p>See how inquiry, proposal, and delivery fit together in an interactive illustration.</p></div><div className={styles.illustration}><AgencyWorld/></div></section>

      <section className={styles['cta-band']} data-world-step="closing"><div className={styles.container}><p className={styles.eyebrow}>Your next project</p><h2>Let’s make the next step clear.</h2><Link className={styles.primary} href="/inquire">Start inquiry<ArrowUpRight size={17} aria-hidden/></Link><p className={styles['cta-note']}>A conversation first. An agreed proposal next.</p></div></section>
    </main>
    <MarketingFooter/>
  </PublicTheme>;
}
