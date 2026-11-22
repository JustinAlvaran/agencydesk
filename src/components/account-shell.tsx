import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { BrandMark } from './brand-mark';
import styles from './account-shell.module.css';

export function AccountShell({ children }: { children: ReactNode }) {
  return <main id="main-content" className={styles.page}>
    <div className={styles.story}>
      <Link className={styles.brand} href="/" aria-label="AgencyDesk home"><BrandMark/>AgencyDesk</Link>
      <div className={styles.intro}><p className={styles.eyebrow}>A little less admin. A lot more clarity.</p><h2>Good work starts <br/>with a clear view.</h2><p>Bring your conversations, proposals and project delivery into one shared workspace.</p><ul>{['Keep the next follow-up in sight','Move from an agreed scope to delivery','Give clients a space of their own'].map(item=><li key={item}><Check size={18} aria-hidden/>{item}</li>)}</ul></div>
      <p className={styles.footnote}>Your team. Your clients. Everything in its place.</p>
    </div>
    <div className={styles.formSide}><Link className={styles.back} href="/"><ArrowLeft size={16} aria-hidden/>Back to website</Link><section className={styles.card}>{children}</section><p className={styles.accessNote}>Access is managed by your agency administrator.</p></div>
  </main>;
}
