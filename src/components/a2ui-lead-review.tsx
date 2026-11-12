'use client';

import {Component, useState, type ReactNode} from 'react';
import dynamic from 'next/dynamic';
import {ArrowRight, RotateCcw, Sparkles} from 'lucide-react';
import {leadPresets, type LeadPreset} from '@/lib/a2ui-lead-review';
import styles from './a2ui-lead-review.module.css';

const LeadSurface = dynamic(() => import('./a2ui-lead-surface').then(module => module.LeadSurface), {
  ssr: false,
  loading: () => <div className={styles.response} role='status'>Loading interactive view…</div>,
});

class SurfaceBoundary extends Component<{children: ReactNode; onReset: () => void}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  render() {
    if (this.state.failed) return <div role='alert' className={styles.error}><h2>The sample view could not load.</h2><p>Reset the demo to try again.</p><button type='button' className={styles.reset} onClick={this.props.onReset}>Reset demo</button></div>;
    return this.props.children;
  }
}

export function A2uiLeadReview() {
  const [preset, setPreset] = useState<LeadPreset>('open');
  const [revision, setRevision] = useState(0);
  function reset() { setPreset('open'); setRevision(value => value + 1); }
  return <div className={styles.pilot}>
    <header className={styles.intro}>
      <p className={styles.eyebrow}><Sparkles size={15} aria-hidden='true'/> Interactive workspace</p>
      <h1>A clearer way to review leads.</h1>
      <p>Choose a question. Explore a response built from your workspace’s own components.</p>
    </header>
    <div className={styles.layout}>
      <aside className={styles.prompts} aria-label='Sample questions'>
        <span className={styles.sparkleMark} aria-hidden='true'><Sparkles size={23}/></span>
        <h2>What needs your attention?</h2>
        <p className={styles.promptDescription}>Start with a sample question to see the workspace take shape.</p>
        <div className={styles.promptList}>{leadPresets.map(option => <button key={option.id} type='button' aria-pressed={preset === option.id} className={styles.prompt} onClick={() => {setPreset(option.id); setRevision(value => value + 1);}}>{option.label}<ArrowRight size={16} aria-hidden='true'/></button>)}</div>
        <div className={styles.demoNote}><strong>Try it with sample data</strong><p>Prebuilt demo responses. No AI model is connected.</p></div>
      </aside>
      <div className={styles.surfaceColumn}>
        <div className={styles.surfaceBar}><span><span className={styles.readyDot} aria-hidden='true'/> Fictional leads · Read-only</span><button type='button' className={styles.reset} onClick={reset}><RotateCcw size={14} aria-hidden='true'/> Reset demo</button></div>
        <p className='sr-only' role='status'>{leadPresets.find(option => option.id === preset)?.title}</p>
        <SurfaceBoundary key={`${preset}-${revision}`} onReset={reset}><LeadSurface preset={preset}/></SurfaceBoundary>
        <p className={styles.footnote}>Powered by A2UI 1.0 · Your components, assembled into an interactive response.</p>
      </div>
    </div>
  </div>;
}
