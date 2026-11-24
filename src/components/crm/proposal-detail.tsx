import Link from 'next/link';
import {notFound} from 'next/navigation';
import {z} from 'zod';
import {requireUser} from '@/lib/auth';
import {databaseError} from '@/lib/http';
import {MutationForm,DraftFields,fieldClass} from './mutation-form';
export async function ProposalDetail({id}:{id:string}){
 if(!z.uuid().safeParse(id).success)notFound();const {supabase,user}=await requireUser();
 const [series,revisions,staff]=await Promise.all([supabase.from('proposal_series').select('*').eq('id',id).maybeSingle(),supabase.from('proposal_revisions').select('*').eq('series_id',id).order('version',{ascending:false}),supabase.from('staff_members').select('role').eq('user_id',user.id).eq('active',true).maybeSingle()]);
 databaseError(series.error);databaseError(revisions.error);databaseError(staff.error);if(!series.data)notFound();
 const revisionIds=(revisions.data??[]).map(r=>r.id);
 const items=revisionIds.length?await supabase.from('proposal_items').select('*').in('revision_id',revisionIds).order('position'):{data:[],error:null};databaseError(items.error);
 const membership=await supabase.from('client_memberships').select('can_accept_proposals').eq('user_id',user.id).eq('company_id',series.data.company_id).eq('active',true).maybeSingle();databaseError(membership.error);
 return <div className="flex flex-col gap-6"><Link href={staff.data?'/crm/proposals':'/portal'} className="text-sm text-primary">Back to proposals</Link><h1 className="text-3xl font-bold">{series.data.title}</h1>
 {(revisions.data??[]).map(r=><section key={r.id} className="rounded-3xl p-6 bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 flex flex-col gap-4">
 <h2 className="text-lg font-bold">Version {r.version} · {r.status}</h2><p className="whitespace-pre-wrap text-sm">{r.scope}</p><p className="whitespace-pre-wrap text-sm text-gray-500">Payment terms: {r.payment_terms||'See scope'}</p>
 <table className="w-full text-sm"><thead><tr><th className="text-left">Deliverable</th><th>Quantity</th><th>Unit price</th></tr></thead><tbody>{(items.data??[]).filter(i=>i.revision_id===r.id).map(i=><tr key={i.id}><td className="py-3">{i.description}</td><td className="text-center">{i.quantity}</td><td className="text-center">${(i.unit_price_cents/100).toLocaleString()}</td></tr>)}</tbody></table>
 <p className="font-bold">{r.status==='draft'?'Draft subtotal':'Agreed total'}: ${((r.status==='draft'?(items.data??[]).filter(i=>i.revision_id===r.id).reduce((sum,i)=>sum+i.unit_price_cents*i.quantity,0):r.total_cents)/100).toLocaleString()}</p><p className="text-xs text-gray-500">Expires {new Date(r.expires_at).toLocaleDateString('en-US',{timeZone:'UTC'})} (UTC)</p>
 {staff.data&&r.status==='draft'&&<><MutationForm command="item" id={r.id} label="Add deliverable"><label>Deliverable<input name="description" required maxLength={1000} className={fieldClass}/></label><label>Quantity<input type="number" name="quantity" min="1" max="10000" defaultValue="1" required className={fieldClass}/></label><label>Unit price (USD)<input type="number" name="unit_price" step="0.01" min="0.01" max="1000000" required className={fieldClass}/></label></MutationForm><MutationForm command="publish" id={r.id} label="Publish immutable scope"/></>}
 {staff.data&&r.status==='published'&&<><MutationForm command="link" id={r.id} label="Create private scope link"/><MutationForm command="revoke_links" id={r.id} label="Revoke scope links"/></>}
 {membership.data?.can_accept_proposals&&r.status==='published'&&<><MutationForm command="accept" id={r.id} label="Accept this version"><label className="text-sm flex gap-2"><input required type="checkbox" name="confirm"/>I accept this exact scope, price, and payment terms.</label></MutationForm><MutationForm command="decline" id={r.id} label="Decline this version"/></>}
 </section>)}
 {staff.data&&<details className="rounded-3xl p-6 border border-gray-200 dark:border-zinc-800"><summary className="cursor-pointer font-bold">Create another revision</summary><MutationForm command="revision" id={id} label="Create draft revision"><DraftFields/></MutationForm></details>}
 </div>;
}
