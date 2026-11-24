import {ProposalDetail} from '@/components/crm/proposal-detail';
export default async function Page({params}:{params:Promise<{id:string}>}){return <ProposalDetail id={(await params).id}/>;}
