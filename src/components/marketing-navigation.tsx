'use client';

import Link from 'next/link';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { BrandMark } from './brand-mark';
import styles from './public-theme.module.css';

const links = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/case-studies', label: 'Sample projects' },
  { href: '/demo', label: 'Workspace demo' },
  { href: '/crm', label: 'Staff CRM' },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  return <header className="site-nav">
    <Link className={styles.brand} href="/" aria-label="AgencyDesk home"><BrandMark/>AgencyDesk</Link>
    <nav className="site-nav-links" aria-label="Main navigation">{links.slice(1,4).map(link=><Link href={link.href} key={link.href}>{link.label}</Link>)}</nav>
    <div className={styles.headerActions}><Link className={styles.staffLink} href="/login">Sign in</Link><Link className="button button-primary" href="/inquire">Start inquiry<ArrowUpRight size={15} aria-hidden/></Link>
      <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger className={styles.menuButton} aria-label="Open main navigation"><Menu size={21} aria-hidden/></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="sheet-overlay"/><Dialog.Content className={styles.publicDrawer}><Dialog.Title>AgencyDesk</Dialog.Title><Dialog.Description>Studio & workspace</Dialog.Description><Dialog.Close className={styles.drawerClose} aria-label="Close main navigation"><X size={21} aria-hidden/></Dialog.Close><nav aria-label="Mobile main navigation">{links.map(link=><Link href={link.href} key={link.href} onClick={()=>setOpen(false)}>{link.label}<ArrowUpRight size={16} aria-hidden/></Link>)}</nav><Link className="button button-primary" href="/inquire" onClick={()=>setOpen(false)}>Start inquiry<ArrowUpRight size={16} aria-hidden/></Link></Dialog.Content></Dialog.Portal></Dialog.Root>
    </div>
  </header>;
}
