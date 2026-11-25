import View from './dashboard-view';
import { requireStaff } from '@/lib/auth';
import { crmData } from '@/lib/crm-data';
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
    supabase.rpc('get_dashboard_metrics'),
  ]);

  let acceptedCents = 0;
  if (metrics?.data && typeof (metrics.data as { accepted_cents?: number }).accepted_cents === 'number') {
    acceptedCents = (metrics.data as { accepted_cents: number }).accepted_cents;
  } else if (data.proposals) {
    acceptedCents = data.proposals
      .filter((p: { status: string }) => p.status === 'accepted')
      .reduce((sum: number, p: { total_cents?: number }) => sum + (p.total_cents || 0), 0);
  }

  return (
    <View
      initialLeads={data.leads || []}
      initialProjects={data.projects || []}
      initialTasks={data.tasks || []}
      initialActivities={data.activities || []}
      totalPipeline={(data.totals?.pipeline_cents ?? 0) / 100}
      weightedPipeline={(data.totals?.weighted_cents ?? 0) / 100}
      openLeads={data.totals?.open_leads ?? 0}
      acceptedValue={acceptedCents / 100}
    />
  );
}
