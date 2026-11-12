'use client';

import {useEffect, useMemo, useState} from 'react';
import {A2uiSurface, type ReactCatalogComponent} from '@a2ui/react';
import {MessageProcessor} from '@a2ui/web_core/v1_0';
import {buildLeadSurface, LEAD_SURFACE_ID, readLeadAction, type LeadPreset} from '@/lib/a2ui-lead-review';
import {leadReviewCatalog} from './a2ui-lead-catalog';
import styles from './a2ui-lead-review.module.css';

function createSession(preset: LeadPreset, selectedId: string | undefined, onInspect: (id: string) => void) {
  const processor = new MessageProcessor<ReactCatalogComponent>([leadReviewCatalog], action => {
    const id = readLeadAction(action);
    if (id === null) return;
    try { buildLeadSurface(preset, id); } catch { return; }
    onInspect(id);
  });
  processor.processMessages([buildLeadSurface(preset, selectedId)]);
  const surface = processor.getSurfaces().get(LEAD_SURFACE_ID);
  if (!surface) throw new Error('Sample surface unavailable');
  return {processor, surface};
}

// Browser-only: the SDK registers custom elements and has no SSR snapshot.
export function LeadSurface({preset}: {preset: LeadPreset}) {
  const [selectedId, setSelectedId] = useState<string>();
  const session = useMemo(() => createSession(preset, selectedId, setSelectedId), [preset, selectedId]);
  // This pilot registers no RPC functions. dispose() clears only SDK RPC state.
  useEffect(() => () => session.processor.dispose(), [session]);
  return <div role='region' aria-label='Lead review response' className={styles.response}>
    <A2uiSurface key={selectedId ?? 'initial'} surface={session.surface}/>
  </div>;
}
