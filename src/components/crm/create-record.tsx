'use client';
import * as Dialog from '@radix-ui/react-dialog';
import {MutationForm,DraftFields,fieldClass} from './mutation-form';
export function CreateRecord({kind,leads=[],companies=[]}:{kind:'contact'|'proposal';leads?:{id:string;contact_name:string}[];companies?:{id:string;name:string}[]}) {
 return <Dialog.Root><Dialog.Trigger className="self-start rounded-xl px-4 py-2 text-xs font-bold uppercase bg-primary text-white">{kind==='contact'?'Add Contact':'New Proposal'}</Dialog.Trigger>
 <Dialog.Portal><Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"/><Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg max-h-[85dvh] overflow-auto rounded-3xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-6 shadow-2xl">
  <Dialog.Title className="text-xl font-bold mb-2">{kind==='contact'?'New client contact':'New proposal draft'}</Dialog.Title><Dialog.Description className="text-sm text-gray-500 mb-5">Save this record in your agency workspace.</Dialog.Description>
  <MutationForm command={kind} label="Create">
  {kind==='contact'?<>{[['name','Contact name'],['email','Email'],['company','Company']].map(([name,label])=><label key={name} className="text-sm">{label}<input required name={name} type={name==='email'?'email':'text'} maxLength={200} className={fieldClass}/></label>)}</>:<>
  <label className="text-sm">Title<input required name="title" maxLength={200} className={fieldClass}/></label>
  <label className="text-sm">Lead<select required name="lead_id" className={fieldClass}><option value="">Choose a lead</option>{leads.map(l=><option key={l.id} value={l.id}>{l.contact_name}</option>)}</select></label>
  <label className="text-sm">Client company<select required name="company_id" className={fieldClass}><option value="">Choose a company</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><DraftFields/>
  </>}
  </MutationForm><Dialog.Close className="mt-4 text-sm text-gray-500">Close</Dialog.Close>
 </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
