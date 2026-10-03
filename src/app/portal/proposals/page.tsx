import Link from 'next/link';
import {listRows,type SearchParams} from '@/lib/data';
import type {Proposal} from '@/lib/domain';
import {Heading,Pages} from '@/app/crm/workspace-ui';

export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){
 const records=await listRows<Proposal>('proposal_series',await searchParams,true);
 return <>
  <Heading title="Proposals"/>
  <div className="panel table-scroll" role="region" aria-label="Your proposals" tabIndex={0}><table className="data-table"><thead><tr><th scope="col">Title</th><th scope="col">Created</th></tr></thead><tbody>
   {records.rows.map(proposal=><tr key={proposal.id}><td><Link className="table-title" href={`/portal/proposals/${proposal.id}`}>{proposal.title}</Link></td><td>{new Date(proposal.created_at).toLocaleDateString('en-US',{timeZone:'Asia/Manila'})}</td></tr>)}
   {!records.rows.length&&<tr><td colSpan={2}>No proposals have been shared with your company.</td></tr>}
  </tbody></table></div>
  <Pages {...records} base="/portal/proposals"/>
 </>;
}
