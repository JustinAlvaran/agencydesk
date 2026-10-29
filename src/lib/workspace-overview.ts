import type {DashboardData} from './domain';

/** Previews describe only the loaded page, never replace authoritative totals. */
export function overviewPreview(data:DashboardData) {
  const due=(value:string|null)=> {
    const instant=value ? Date.parse(value) : NaN;
    return Number.isFinite(instant) ? instant : Infinity;
  };
  return {
    leads:data.leads.filter(lead=>!lead.archived_at&&!['won','lost'].includes(lead.status)).slice(0,4),
    tasks:data.tasks.filter(task=>!task.completed_at).sort((a,b)=>due(a.due_at)-due(b.due_at)||a.id.localeCompare(b.id)).slice(0,4),
    projects:data.projects.filter(project=>project.status==='active').slice(0,4),
  };
}
