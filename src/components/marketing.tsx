import Link from "next/link";
import {PanelsTopLeft} from 'lucide-react';
import theme from './public-theme.module.css';
import { Button } from "./ui/primitives";
import { ServiceAssistant } from './service-assistant';
import { publicServices } from '@/lib/website-content';
import { isDemo } from '@/lib/env';

export function MarketingHeader() {
  return (
    <header className="site-nav">
      <Link className={theme.brand} href="/" aria-label="AgencyDesk home"><PanelsTopLeft size={25} aria-hidden="true"/>AgencyDesk</Link>
      <nav className="site-nav-links" aria-label="Main navigation">
        <Link href="/">Home</Link>
        <Link href="/services">Services</Link>
        <Link href="/case-studies">Sample projects</Link>
        <Link href="/demo">Demo</Link>
        <Link href="/crm">Staff CRM</Link>
      </nav>
      <Button asChild><Link href="/inquire">Start inquiry</Link></Button>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="site-footer">
      <p>AgencyDesk · Websites, applications, and connected workflows. Sample projects and demo records are illustrative.</p>
      <nav className="site-footer-links" aria-label="Footer navigation">
        <Link href="/demo">Explore demo</Link>
        <Link href="/crm">Staff CRM</Link>
      </nav>
      <ServiceAssistant services={publicServices.map(({id,title,description,bullet_1,bullet_2,bullet_3})=>({id,title,description,bullet_1,bullet_2,bullet_3}))} available={!isDemo()}/>
    </footer>
  );
}

export function WorkflowPreview() {
  return (
    <section className="panel workflow-preview" aria-labelledby="workflow-heading">
      <div className="panel-heading"><h2 id="workflow-heading">Project workflow</h2></div>
      <ol className="workflow-preview-list">
        <li><Link href="/inquire">Submit an inquiry</Link><p>Share your requirements, budget, and timeline.</p></li>
        <li><Link href="/demo/leads">Review the lead</Link><p>Track the conversation and next follow-up.</p></li>
        <li><Link href="/demo/proposals">Agree on a proposal</Link><p>Define the scope and price before work begins.</p></li>
        <li><Link href="/demo/projects">Track the project</Link><p>Check progress and upcoming milestones.</p></li>
        <li><Link href="/demo/portal">Open the client portal</Link><p>Share project updates with the client.</p></li>
      </ol>
    </section>
  );
}
