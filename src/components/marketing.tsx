import Link from "next/link";
import {ArrowUpRight} from 'lucide-react';
import { BrandMark } from './brand-mark';
import theme from './public-theme.module.css';
import { ServiceAssistant } from './service-assistant';
import { publicServices } from '@/lib/website-content';
import { isDemo } from '@/lib/env';

export {MarketingHeader} from './marketing-navigation';

export function MarketingFooter() {
  return <footer className="site-footer">
    <div className={theme.footerTop}><Link className={theme.brand} href="/"><BrandMark/>AgencyDesk</Link><p>Websites, applications,<br/>and connected workflows.</p><Link className="button button-secondary" href="/inquire">Start a conversation<ArrowUpRight size={16} aria-hidden/></Link></div>
    <div className={theme.footerBottom}><p>AgencyDesk · Sample projects and demo records are illustrative.</p><nav className="site-footer-links" aria-label="Footer navigation"><Link href="/demo">Explore demo</Link><Link href="/crm">Staff CRM</Link></nav><ServiceAssistant services={publicServices.map(({id,title,description,bullet_1,bullet_2,bullet_3})=>({id,title,description,bullet_1,bullet_2,bullet_3}))} available={!isDemo()}/></div>
  </footer>;
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
