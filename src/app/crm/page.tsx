import View from './dashboard-view';
import { requireStaff } from '@/lib/auth';
import { crmData } from '@/lib/crm-data';
import { databaseError } from '@/lib/http';
import { isDemo } from '@/lib/env';

export default async function Page() {
  const { supabase } = await requireStaff();

  if (isDemo() || !supabase) {
    const data = await crmData(null);
    return (
      <View
        initialLeads={data.leads}
        initialProjects={data.projects}
        initialTasks={data.tasks}
        initialActivities={data.activities}
        totalPipeline={(data.totals?.pipeline_cents ?? 0) / 100}
        weightedPipeline={(data.totals?.weighted_cents ?? 0) / 100}
        openLeads={data.totals?.open_leads ?? 0}
        acceptedValue={65000}
      />
    );
  }

  const [data, metrics] = await Promise.all([
    crmData(supabase),
    supabase.rpc('get_dashboard_metrics')
  ]);

  databaseError(metrics.error);
  const totals = metrics.data as { accepted_cents: number };

  return (
    <View
      initialLeads={data.leads}
      initialProjects={data.projects}
      initialTasks={data.tasks}
      initialActivities={data.activities}
      totalPipeline={(data.totals?.pipeline_cents ?? 0) / 100}
      weightedPipeline={(data.totals?.weighted_cents ?? 0) / 100}
      openLeads={data.totals?.open_leads ?? 0}
      acceptedValue={totals.accepted_cents / 100}
    />
  );
}
