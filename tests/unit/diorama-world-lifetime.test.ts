import {beforeEach,afterEach,describe,expect,it,vi} from 'vitest';
import {BufferGeometry,Material} from 'three';
const state=vi.hoisted(()=>({renders:0,sizes:0,disposed:0,removed:0,disconnected:0,painted:false,throws:false,callback:null as null|(()=>void),listeners:new Set<unknown>()}));
vi.mock('three',async importOriginal=>{
 const actual=await importOriginal<typeof import('three')>();
 return {...actual,WebGLRenderer:class {
  shadowMap={enabled:false,type:0};
  domElement={style:{},setAttribute(){},addEventListener(_type:string,fn:unknown){state.listeners.add(fn);},removeEventListener(_type:string,fn:unknown){state.listeners.delete(fn);},remove(){state.removed++;}};
  setPixelRatio(){} setSize(){state.sizes++;state.painted=false;}
  render(){state.renders++;if(state.throws)throw new Error('Fictional initial render failure');state.painted=true;}
  dispose(){state.disposed++;} forceContextLoss(){}
 }};
});
import {createDioramaWorld} from '@/components/diorama-world';
const host=()=>({clientWidth:1440,clientHeight:1000,dataset:{} as Record<string,string>,appendChild:vi.fn()}) as unknown as HTMLElement;
beforeEach(()=>{
 Object.assign(state,{renders:0,sizes:0,disposed:0,removed:0,disconnected:0,painted:false,throws:false,callback:null});state.listeners.clear();
 vi.stubGlobal('window',{devicePixelRatio:1,scrollY:0,innerHeight:1000,addEventListener(_type:string,fn:unknown){state.listeners.add(fn);},removeEventListener(_type:string,fn:unknown){state.listeners.delete(fn);}});
 vi.stubGlobal('document',{querySelectorAll:()=>[]});vi.stubGlobal('innerWidth',1440);vi.stubGlobal('innerHeight',1000);
 vi.stubGlobal('ResizeObserver',class {constructor(callback:()=>void){state.callback=callback;}observe(){}disconnect(){state.disconnected++;}});
 vi.stubGlobal('requestAnimationFrame',vi.fn(()=>1));vi.stubGlobal('cancelAnimationFrame',vi.fn());
});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
describe('world rendering lifetime',()=>{
 it('redraws a paused world when an observer resize clears its buffer',()=>{
  const controller=createDioramaWorld(host(),{paused:true,exploded:false},vi.fn());
  expect(state.painted).toBe(true);const before=state.renders;
  state.callback?.();
  expect(state.painted).toBe(true);expect(state.renders).toBeGreaterThan(before);controller.dispose();
 });
 it('releases all allocated resources and exposes fallback after initial render failure',()=>{
  const disposeGeometry=vi.spyOn(BufferGeometry.prototype,'dispose'),disposeMaterial=vi.spyOn(Material.prototype,'dispose');
  const element=host(),unavailable=vi.fn();state.throws=true;
  expect(()=>createDioramaWorld(element,{paused:true,exploded:false},unavailable)).not.toThrow();
  expect(unavailable).toHaveBeenCalledOnce();expect(state.disposed).toBe(1);expect(state.removed).toBe(1);
  expect(state.disconnected).toBe(1);expect(state.listeners.size).toBe(0);expect(element.dataset.rendered).toBeUndefined();
  expect(disposeGeometry).toHaveBeenCalled();expect(disposeMaterial).toHaveBeenCalled();
 });
 it('makes disposal idempotent and ignores queued observer callbacks after disposal',()=>{
  const controller=createDioramaWorld(host(),{paused:true,exploded:true},vi.fn());
  const callback=state.callback;controller.dispose();controller.dispose();const before=state.sizes;
  callback?.();expect(state.sizes).toBe(before);expect(state.disposed).toBe(1);expect(state.listeners.size).toBe(0);
 });
});
