'use client';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {Layers3,Pause,Play} from 'lucide-react';
import type {WorldController} from './diorama-world';
import styles from './diorama-world.module.css';
const subscribeMotion=(notify:()=>void)=>{const media=matchMedia('(prefers-reduced-motion: reduce)');media.addEventListener('change',notify);return()=>media.removeEventListener('change',notify);};
const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const subscribeVisibility=(notify:()=>void)=>{document.addEventListener('visibilitychange',notify);return()=>document.removeEventListener('visibilitychange',notify);};
const visibleTab=()=>document.visibilityState==='visible';
export function AgencyWorld() {
 const host=useRef<HTMLDivElement>(null),controller=useRef<WorldController|null>(null);
 const state=useRef({paused:false,exploded:false});
 const [paused,setPaused]=useState(false),[exploded,setExploded]=useState(false),[failed,setFailed]=useState(false);
 const reduced=useSyncExternalStore(subscribeMotion,reducedMotion,()=>true);
 const foreground=useSyncExternalStore(subscribeVisibility,visibleTab,()=>false);
 useEffect(()=>{
  if(reduced||!foreground||failed||!host.current)return;
  const element=host.current;let cancelled=false,instance:WorldController|undefined;
  import('./diorama-world').then(({createDioramaWorld})=>{
   if(cancelled)return;
   instance=createDioramaWorld(element,state.current,()=>{if(!cancelled)setFailed(true);});
   controller.current=instance;
  }).catch(()=>{if(!cancelled)setFailed(true);});
  return()=>{cancelled=true;instance?.dispose();controller.current=null;};
 },[reduced,foreground,failed]);
 const toggleLayers=()=>{const next=!state.current.exploded;state.current.exploded=next;setExploded(next);controller.current?.setExploded(next);};
 const togglePause=()=>{const next=!state.current.paused;state.current.paused=next;setPaused(next);controller.current?.setPaused(next);};
 return <div className={styles.worldUI}>
  <div ref={host} className={styles.viewport} data-agency-world aria-hidden='true'/>
  <div className={styles.fallback} data-exploded={exploded||undefined} aria-hidden='true'><div className={styles.platform}/><div className={styles.plate}><i/><i/><i/></div><div className={styles.plate}><i/><i/><i/></div><div className={styles.plate}><i/><i/><i/></div><span className={styles.orbit}/></div>
  <div className={styles.controlPanel}>
   <p className={styles.worldLabel}><span/>THE AGENCY WORLD</p>
   <p className={styles.journey}>Inquiry → proposal → delivery</p>
   <div className={styles.controls}><button type='button' onClick={toggleLayers} aria-pressed={exploded}><Layers3 size={15} aria-hidden='true'/>{exploded?'Close the layers':'Open the layers'}</button><button type='button' onClick={togglePause} aria-pressed={paused||reduced||failed} disabled={reduced||failed}>{paused?<Play size={14} aria-hidden='true'/>:<Pause size={14} aria-hidden='true'/>}{failed?'Static world':reduced?'Reduced motion':paused?'Resume world':'Pause world'}</button></div>
   <p className={styles.hint}>An interactive illustration. No customer records.</p>
  </div>
 </div>;
}
