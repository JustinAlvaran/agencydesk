'use client';

import {useEffect,useId,useRef,useState,type FormEvent} from 'react';
import Link from 'next/link';
import type {AssistantService} from '@/lib/service-assistant';

export function ServiceAIQuestion({services,recentQuestions,onQuestion,onInquire}:{services:AssistantService[];recentQuestions:string[];onQuestion:(question:string)=>void;onInquire:(service:string)=>void}){
  const [question,setQuestion]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [matched,setMatched]=useState<AssistantService|null>(null);
  const [turns,setTurns]=useState<Array<{question:string;answer:string}>>([]);
  const fieldId=useId();
  const input=useRef<HTMLTextAreaElement>(null),inFlight=useRef(false),controller=useRef<AbortController|null>(null),mounted=useRef(true);
  useEffect(()=>{mounted.current=true;input.current?.focus({preventScroll:true});return()=>{mounted.current=false;controller.current?.abort();};},[]);
  // Focus after React commits the enabled textarea, not in a frame that may
  // run before the pending disabled-state update has committed.
  useEffect(()=>{if(!busy)input.current?.focus();},[busy]);
  async function ask(event:FormEvent){
    event.preventDefault();if(inFlight.current||!question.trim())return;
    inFlight.current=true;setBusy(true);setError('');setMatched(null);
    const value=question.trim(),abort=new AbortController();controller.current=abort;
    const timer=setTimeout(()=>abort.abort(),16_000);
    try{
      const response=await fetch('/api/service-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:value,recent_questions:recentQuestions}),signal:abort.signal});
      if(!response.ok)throw new Error('Unavailable');
      const answer=await response.json();
      if(typeof answer.answer!=='string'||!answer.answer.trim()||answer.answer.length>1600)throw new Error('Invalid answer');
      if(!mounted.current)return;
      setTurns(previous=>[...previous,{question:value,answer:answer.answer}].slice(-10));
      onQuestion(value);
      setQuestion('');setMatched(services.find(service=>service.id===answer.service_id)??null);
    }catch{if(mounted.current)setError(abort.signal.aborted?'The answer took too long. The service guide and inquiry form are still available.':'AI answers are unavailable. Return to the service guide or prepare an inquiry.');}
    finally{clearTimeout(timer);inFlight.current=false;if(mounted.current)setBusy(false);}
  }
  return <div className="assistant-ai-question"><p className="muted">AI can be mistaken; scope, price and timing require a reviewed proposal. Questions use Cloudflare and our published services. We do not save chat transcripts. Avoid personal details, passwords and confidential information. A temporary cookie and hashed usage records limit requests. Usage records older than 48 hours are removed on later requests; periods without requests may retain them longer. <a href="https://developers.cloudflare.com/workers-ai/platform/data-usage/" target="_blank" rel="noopener noreferrer">AI data policy</a></p><div role="log" aria-label="AI service conversation" aria-live="polite">{turns.map((turn,index)=><div key={index}><p><strong>You:</strong> {turn.question}</p><p><strong>AgencyDesk AI:</strong> {turn.answer}</p></div>)}</div><form onSubmit={ask}><label htmlFor={fieldId}>Your services question</label><textarea ref={input} id={fieldId} maxLength={2000} value={question} disabled={busy} onChange={event=>setQuestion(event.target.value)} rows={3} required placeholder="For example: Can you build a portal for my clients?"/><button className="button button-primary" disabled={busy||!question.trim()}>{busy?'Preparing an answer…':'Ask AI'}</button></form><p role="status" aria-live="polite">{busy?'Checking our service information…':error}</p><div className="assistant-actions">{matched&&<Link href={`/services/${matched.id}`}>Read {matched.title.toLowerCase()}</Link>}<button className="button button-secondary" onClick={()=>onInquire(matched?.title??'Not sure yet')}>Prepare project inquiry</button></div></div>;
}
