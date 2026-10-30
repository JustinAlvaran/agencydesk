"use client";
import {Play} from 'lucide-react';
import styles from './launch-home.module.css';
const reducedMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export function WatchWorkflow() {
  return <button className={styles.secondaryAction} type='button' onClick={()=>document.getElementById('workflow')?.scrollIntoView({behavior:reducedMotion()?'instant':'smooth',block:'start'})}><Play size={14} aria-hidden='true'/>Watch the workflow</button>;
}
