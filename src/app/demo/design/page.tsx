import {AppShell} from '@/components/app-shell';
import {DashboardView} from '@/components/workspace-dashboard';
import type {DashboardData} from '@/lib/domain';
export const metadata={title:'Empty design preview',robots:{index:false,follow:false}};
const empty:DashboardData={leads:[],proposals:[],projects:[],tasks:[],openLeads:0,pipelineValue:0,acceptedValue:0,overdueTasks:0};
export default function Page(){return <AppShell mode='demo' title='Design preview' demoLabel='Empty interface preview' description='Empty interface preview. No records are loaded.'><DashboardView readOnly data={empty} emptyPreview/></AppShell>;}
