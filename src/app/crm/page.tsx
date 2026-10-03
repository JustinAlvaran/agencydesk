import {dashboardData} from '@/lib/data';
import {DashboardView} from '@/components/workspace-views';
export default async function Page(){return <DashboardView data={await dashboardData()} readOnly={false}/>;}
