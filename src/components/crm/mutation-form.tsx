'use client';
import { useState,useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { crmCommand } from '@/app/crm/commands';
export const fieldClass='w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 p-3 text-sm text-gray-900 dark:text-white';
export function MutationForm({command,children,label='Save',id}:{command:string;children?:React.ReactNode;label?:string;id?:string}) {
 const [pending,start]=useTransition();const [result,setResult]=useState<{error?:string;message?:string;url?:string}>({});const router=useRouter();
 return <form className="flex flex-col gap-3" action={form=>start(async()=>{const response=await crmCommand(command,form);setResult(response);if(!response.error){if(response.url&&command==='proposal')router.push(response.url);router.refresh();}})}>
  {id&&<input type="hidden" name="id" value={id}/>}{children}
  <button disabled={pending} className="self-start rounded-xl px-4 py-2 text-xs font-bold bg-primary text-white disabled:opacity-50">{pending?'Saving…':label}</button>
  {result.error&&<p role="alert" className="text-sm text-primary">{result.error}</p>}
  {result.message&&<p role="status" className="text-sm text-gray-500">{result.message}</p>}
  {result.url&&command==='link'&&<input aria-label="Private proposal link" readOnly className={fieldClass} value={`${window.location.origin}${result.url}`} onFocus={event=>event.target.select()}/>}
 </form>;
}
export function DraftFields(){return <>
 <label className="text-sm">Scope<textarea required name="scope" maxLength={10000} className={fieldClass}/></label>
 <label className="text-sm">Payment terms<textarea required name="terms" maxLength={4000} className={fieldClass}/></label>
 <label className="text-sm">Offer expiry (UTC)<input required type="date" name="expires" className={fieldClass}/></label>
 <label className="text-sm">Deliverable<input required name="description" maxLength={1000} className={fieldClass}/></label>
 <div className="grid grid-cols-2 gap-3"><label className="text-sm">Quantity<input required type="number" name="quantity" min="1" max="10000" defaultValue="1" className={fieldClass}/></label>
 <label className="text-sm">Unit price (USD)<input required type="number" name="unit_price" min="0.01" max="1000000" step="0.01" className={fieldClass}/></label></div>
 </>;}
