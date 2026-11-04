/** Load decorative WebGL only after critical resources and visible page content. */
export function scheduleWorldStart(element: HTMLElement, start: ()=>void, alreadyVisible=false): ()=>void {
 let cancelled=false,started=false,scheduled=false;
 let visible=alreadyVisible,loaded=document.readyState==='complete';
 let observer: IntersectionObserver|undefined,idle:number|undefined,timer:number|undefined;
 const run=()=>{if(cancelled||started)return;started=true;start();};
 const schedule=()=>{
  if(cancelled||scheduled||!loaded||!visible)return;
  scheduled=true;
  if(typeof window.requestIdleCallback==='function')idle=window.requestIdleCallback(run,{timeout:1000});
  else timer=window.setTimeout(run,0);
 };
 const onLoad=()=>{loaded=true;schedule();};
 if(!visible&&typeof window.IntersectionObserver==='function'){
  observer=new window.IntersectionObserver(entries=>{
   if(!entries.some(entry=>entry.isIntersecting))return;
   visible=true;observer?.disconnect();schedule();
  },{threshold:0});
  observer.observe(element);
 }else visible=true;
 if(!loaded)window.addEventListener('load',onLoad,{once:true});
 schedule();
 return()=>{
  cancelled=true;observer?.disconnect();window.removeEventListener('load',onLoad);
  if(idle!==undefined)window.cancelIdleCallback(idle);
  if(timer!==undefined)window.clearTimeout(timer);
 };
}
