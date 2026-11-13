import {useEffect, useRef} from 'react';
import {ArrowUpRight, Check, FileText} from 'lucide-react';
import {createComponentImplementation} from '@a2ui/react';
import {Catalog} from '@a2ui/web_core/v1_0';
import {reviewApi, leadCardApi, leadDetailApi} from '@/lib/a2ui-lead-catalog';
import {LEAD_CATALOG_ID} from '@/lib/a2ui-lead-review';
import styles from './a2ui-lead-review.module.css';

const Review = createComponentImplementation(reviewApi, ({props, buildChild}) => (
  <section>
    <div className={styles.responseHeading}>
      <div><p className={styles.eyebrow}>Your workspace, composed</p><h2>{props.title}</h2></div>
      <span className={styles.count}>{props.count} sample leads</span>
    </div>
    <p className={styles.description}>{props.description}</p>
    <div className={styles.cards}>
      {props.children?.map(ref => <div className={ref === 'lead_detail' || (typeof ref !== 'string' && ref.id === 'lead_detail') ? styles.detailSlot : undefined} key={typeof ref === 'string' ? ref : ref.id}>{typeof ref === 'string' ? buildChild(ref) : buildChild(ref.id, ref.basePath)}</div>)}
    </div>
    {props.count === 0 && <p className={styles.empty}>No sample leads in this view. Try another prompt.</p>}
  </section>
));

const Card = createComponentImplementation(leadCardApi, ({props}) => (
  <article className={styles.card}>
    <div className={styles.cardTop}><span className={styles.avatar} aria-hidden='true'>{props.name?.split(' ').map(part => part[0]).join('')}</span><span className={styles.stage}>{props.stage}</span></div>
    <h3>{props.name}</h3><p className={styles.service}>{props.service}</p>
    <div className={styles.cardBottom}><div><span className={styles.fieldLabel}>Estimated budget</span><strong>{props.budget}</strong></div><button type='button' className={styles.inspect} aria-label={`Inspect ${props.name}`} onClick={() => void props.onInspect?.()}>Inspect <ArrowUpRight size={15} aria-hidden='true'/></button></div>
  </article>
));

const Detail = createComponentImplementation(leadDetailApi, function LeadDetail({props}) {
  const region = useRef<HTMLDivElement>(null);
  useEffect(() => { region.current?.focus(); }, [props.name]);
  return <div ref={region} tabIndex={-1} role='region' aria-label={`${props.name} details`} className={styles.detail}>
    <div className={styles.detailHeading}><FileText size={19} aria-hidden='true'/><div><p className={styles.eyebrow}>A little more context</p><h3>{props.name}</h3></div><span className={styles.stage}>{props.service}</span></div>
    <p className={styles.brief}>{props.brief}</p>
    <div className={styles.nextStep}><Check size={17} aria-hidden='true'/><div><h4>Suggested next step</h4><p>{props.nextStep}</p></div></div>
    <p className={styles.detailNote}>For review only. No message is prepared or sent.</p>
  </div>;
});

// No basic catalog or remote functions: only these three local widgets are available.
export const leadReviewCatalog = new Catalog(LEAD_CATALOG_ID, '1.0', [Review, Card, Detail]);
