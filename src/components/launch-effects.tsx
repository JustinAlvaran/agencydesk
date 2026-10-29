"use client";
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {Pause,Play} from 'lucide-react';
import styles from './launch-home.module.css';
const subscribeMotion=(notify:()=>void)=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');media.addEventListener('change',notify);return()=>media.removeEventListener('change',notify);};
const reducedMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const subscribeVisibility=(notify:()=>void)=>{document.addEventListener('visibilitychange',notify);return()=>document.removeEventListener('visibilitychange',notify);};
const visibleTab=()=>document.visibilityState==='visible';
export function AmbientField() {
  const host=useRef<HTMLDivElement>(null);
  const reduced=useSyncExternalStore(subscribeMotion,reducedMotion,()=>true);
  const foreground=useSyncExternalStore(subscribeVisibility,visibleTab,()=>false);
  const [inView,setInView]=useState(false),[paused,setPaused]=useState(false),[failed,setFailed]=useState(false);
  useEffect(()=>{const element=host.current;if(!element)return;const observer=new IntersectionObserver(([entry])=>setInView(entry.isIntersecting),{rootMargin:'80px'});observer.observe(element);return()=>observer.disconnect();},[]);
  const active=inView&&foreground&&!reduced&&!paused&&!failed;
  useEffect(()=>{
    if(!active||!host.current)return;
    const element=host.current;let cancelled=false;let dispose:(()=>void)|undefined;
    import('./emerald-field').then(({createEmeraldField})=>{if(!cancelled)dispose=createEmeraldField(element,()=>{if(!cancelled)setFailed(true);});}).catch(()=>{if(!cancelled)setFailed(true);});
    return()=>{cancelled=true;dispose?.();};
  },[active]);
  return <><div ref={host} className={styles.ambient} data-ambient-field aria-hidden='true'/><div className={styles.ambientControl}><button type='button' disabled={reduced||failed} aria-pressed={paused||reduced||failed} onClick={()=>setPaused(value=>!value)}>{paused?<Play size={12} aria-hidden='true'/>:<Pause size={12} aria-hidden='true'/>}{reduced?'Reduced motion':failed?'Static background':paused?'Resume ambience':'Pause ambience'}</button></div></>;
}
export function WatchWorkflow() {
  return <button className={styles.secondaryAction} type='button' onClick={()=>document.getElementById('workflow')?.scrollIntoView({behavior:reducedMotion()?'instant':'smooth',block:'start'})}><Play size={14} aria-hidden='true'/>Watch the workflow</button>;
}
