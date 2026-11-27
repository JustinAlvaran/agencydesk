import View from './view';
import {requireStaff} from '@/lib/auth';
import {crmData} from '@/lib/crm-data';
export default async function Page() {
  const {supabase} = await requireStaff();
  const data = await crmData(supabase);
  return <View proposals={data.proposals} leads={data.leads} companies={data.companies} />;
}
