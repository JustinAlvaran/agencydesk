import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {scheduleWorldStart} from '@/components/world-startup';
let intersection: IntersectionObserverCallback;
let idle: IdleRequestCallback;
let onLoad: (()=>void)|undefined;
let disconnect: ReturnType<typeof vi.fn>;
let cancelIdle: ReturnType<typeof vi.fn>;
beforeEach(()=>{
 disconnect=vi.fn();cancelIdle=vi.fn();onLoad=undefined;
 vi.stubGlobal('document',{readyState:'loading'});
 vi.stubGlobal('window',{
  IntersectionObserver:class {constructor(callback:IntersectionObserverCallback){intersection=callback;}observe(){}disconnect=disconnect;},
  addEventListener:vi.fn((_name:string,callback:()=>void)=>{onLoad=callback;}),removeEventListener:vi.fn(),
  requestIdleCallback:vi.fn((callback:IdleRequestCallback)=>{idle=callback;return 7;}),cancelIdleCallback:cancelIdle,
  setTimeout,clearTimeout,
 });
});
afterEach(()=>vi.unstubAllGlobals());
const enter=()=>intersection([{isIntersecting:true,intersectionRatio:.5}] as IntersectionObserverEntry[],{} as IntersectionObserver);
const flush=()=>idle({didTimeout:false,timeRemaining:()=>50});
describe('progressive world startup',()=>{
 it('keeps engine work out of page loading and waits until the illustration is visible',()=>{
  const start=vi.fn();const cancel=scheduleWorldStart({} as HTMLElement,start);
  enter();expect(start).not.toHaveBeenCalled();onLoad?.();expect(start).not.toHaveBeenCalled();flush();expect(start).toHaveBeenCalledOnce();cancel();
 });
 it('does not import an offscreen mobile world, even when the page has loaded',()=>{
  const start=vi.fn();scheduleWorldStart({} as HTMLElement,start);onLoad?.();expect(window.requestIdleCallback).not.toHaveBeenCalled();expect(start).not.toHaveBeenCalled();
  enter();flush();expect(start).toHaveBeenCalledOnce();
 });
 it('cancels deferred work and refuses late observer/idle callbacks after unmount',()=>{
  const start=vi.fn();const cancel=scheduleWorldStart({} as HTMLElement,start);enter();onLoad?.();cancel();flush();enter();expect(start).not.toHaveBeenCalled();expect(disconnect).toHaveBeenCalled();expect(cancelIdle).toHaveBeenCalledWith(7);
 });
 it('restores an already activated world after returning to the tab, without another intersection',()=>{
  vi.stubGlobal('document',{readyState:'complete'});const start=vi.fn();scheduleWorldStart({} as HTMLElement,start,true);flush();expect(start).toHaveBeenCalledOnce();
 });
 it('allows a visible marker in short viewports without requiring a fraction of the full scene',()=>{
  vi.stubGlobal('document',{readyState:'complete'});const start=vi.fn();scheduleWorldStart({} as HTMLElement,start);intersection([{isIntersecting:true,intersectionRatio:.01}] as IntersectionObserverEntry[],{} as IntersectionObserver);flush();expect(start).toHaveBeenCalledOnce();
 });
 it('starts once when load and visibility are reported repeatedly',()=>{
  const start=vi.fn();scheduleWorldStart({} as HTMLElement,start);enter();enter();onLoad?.();onLoad?.();flush();flush();expect(start).toHaveBeenCalledOnce();
 });
 it('works without IntersectionObserver or requestIdleCallback and cancels its fallback timer',()=>{
  vi.useFakeTimers();Object.assign(window,{setTimeout,clearTimeout});try{vi.stubGlobal('document',{readyState:'complete'});Object.assign(window,{IntersectionObserver:undefined,requestIdleCallback:undefined});const start=vi.fn();const cancel=scheduleWorldStart({} as HTMLElement,start);cancel();vi.runAllTimers();expect(start).not.toHaveBeenCalled();scheduleWorldStart({} as HTMLElement,start);vi.runAllTimers();expect(start).toHaveBeenCalledOnce();}finally{vi.useRealTimers();}
 });
});
