import Link from 'next/link';
import {AppShell} from '@/components/app-shell';
import {LeadWorkspace} from '@/components/lead-workspace';
export const metadata={title:'Empty pipeline design preview',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{view?:string}>}){
 const {view}=await searchParams;
 return <AppShell mode="demo" title="Pipeline design preview" demoLabel="Empty interface preview" description="Empty interface preview. No records are loaded."><div className="page-heading"><div><h1>Lead pipeline</h1><p className="muted">From the first conversation to a clear next step.</p></div></div><nav aria-label="Preview lead view" style={{display:'flex',gap:12,marginBottom:28}}><Link className="button button-secondary" href="/demo/design/leads">Board</Link><Link className="button button-secondary" href="/demo/design/leads?view=table">Table</Link><Link className="button button-secondary" href="/demo/design">Overview</Link></nav><LeadWorkspace leads={[]} total={0} view={view==='table'?'table':'board'} readOnly/></AppShell>;
}
