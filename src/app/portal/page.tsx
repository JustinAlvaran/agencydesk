import {listRows} from '@/lib/data';
import type {Project,Proposal} from '@/lib/domain';
import {PortalOverview} from '@/components/portal-overview';

export default async function Page() {
  const [projects,proposals] = await Promise.all([
    listRows<Project>('projects',{},true),
    listRows<Proposal>('proposal_series',{},true),
  ]);
  return <PortalOverview projects={projects.rows} proposals={proposals.rows} readOnly={false}/>;
}
