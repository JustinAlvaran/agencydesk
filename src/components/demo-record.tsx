import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { demoLeads, demoProjects, demoProposals } from "@/lib/fixtures";
import { money, statusLabel } from "@/lib/domain";

const formaMilestones = [
  { title: "Discovery & direction", date: "October 2", status: "Complete" },
  { title: "Design system & key screens", date: "October 16", status: "Complete" },
  { title: "Build & accessibility review", date: "October 30", status: "Upcoming" },
  { title: "Launch & handoff", date: "November 6", status: "Upcoming" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="record-field"><dt>{label}</dt><dd>{children}</dd></div>;
}

export function DemoRecord({ section, id, client = false }: { section: string; id: string; client?: boolean }) {
  if (!['leads', 'proposals', 'projects'].includes(section) || (client && section === 'leads')) notFound();
  const base = client ? '/demo/portal' : '/demo';
  const back = client ? '/demo/portal' : `${base}/${section}`;
  const backText = client ? 'Back to client workspace' : `Back to ${section}`;
  const notice = <p className="info-note">Fictional sample record. This demonstration is read-only.</p>;

  if (section === 'leads') {
    const lead = demoLeads.find(record => record.id === id);
    if (!lead) notFound();
    const proposal = demoProposals.find(record => record.lead_id === lead.id);
    return <AppShell title="Lead details"><Link className="back-link" href={back}>{backText}</Link><div className="page-heading"><div><h1>{lead.contact_name}</h1><p>Lead details</p></div></div>{notice}<dl className="record-details"><Field label="Contact">{lead.contact_name}</Field><Field label="Email">{lead.email}</Field><Field label="Service">{lead.service}</Field><Field label="Status">{statusLabel(lead.status)}</Field><Field label="Estimated budget">{money(lead.budget_cents)}</Field><Field label="Owner">{lead.owner_id || 'Unassigned'}</Field></dl><section className="record-section"><h2>Project brief</h2><p>{lead.brief}</p></section>{proposal && <section className="record-section"><h2>Related proposal</h2><Link href={`/demo/proposals/${proposal.id}`}>{proposal.title}</Link></section>}</AppShell>;
  }

  if (section === 'proposals') {
    const proposal = demoProposals.find(record => record.id === id && (!client || (record.company_id === '1' && record.status !== 'draft')));
    if (!proposal) notFound();
    const lead = demoLeads.find(record => record.id === proposal.lead_id);
    const project = proposal.status === 'accepted' ? demoProjects.find(record => record.company_id === proposal.company_id) : undefined;
    return <AppShell role={client ? 'client' : 'staff'} title="Proposal details"><Link className="back-link" href={back}>{backText}</Link><div className="page-heading"><div><h1>{proposal.title}</h1><p>Proposal details</p></div></div>{notice}<dl className="record-details"><Field label="Client">{proposal.client_name || 'Not specified'}</Field><Field label="Status">{statusLabel(proposal.status || 'draft')}</Field><Field label="Proposal value">{money(proposal.total_cents || 0)}</Field></dl><section className="record-section"><h2>Scope</h2><p>{lead?.brief || 'No scope description is available for this sample.'}</p><p className="info-note">The sample scope uses the linked inquiry brief. Detailed revision items are not included in these demo records.</p></section>{!client && lead && <section className="record-section"><h2>Related lead</h2><Link href={`/demo/leads/${lead.id}`}>{lead.contact_name}</Link></section>}{project && <section className="record-section"><h2>Linked project</h2><Link href={`${base}/projects/${project.id}`}>{project.title}</Link></section>}</AppShell>;
  }

  const project = demoProjects.find(record => record.id === id && (!client || record.company_id === '1'));
  if (!project) notFound();
  const acceptedProposal = demoProposals.find(record => record.company_id === project.company_id && record.status === 'accepted');
  return <AppShell role={client ? 'client' : 'staff'} title="Project details"><Link className="back-link" href={back}>{backText}</Link><div className="page-heading"><div><h1>{project.title}</h1><p>Project details</p></div></div>{notice}<dl className="record-details"><Field label="Client">{project.client_name || 'Not specified'}</Field><Field label="Status">{statusLabel(project.status)}</Field><Field label="Target date">{project.due_date ? new Date(`${project.due_date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' }) : 'Not set'}</Field></dl>{acceptedProposal && <section className="record-section"><h2>Accepted proposal</h2><Link href={`${base}/proposals/${acceptedProposal.id}`}>{acceptedProposal.title}</Link><p>{money(acceptedProposal.total_cents || 0)}</p></section>}<section className="record-section"><h2>Milestones</h2>{project.company_id === '1' ? <div className="table-scroll" role="region" aria-label="Project milestones" tabIndex={0}><table className="data-table"><thead><tr><th>Milestone</th><th>Target date</th><th>Status</th></tr></thead><tbody>{formaMilestones.map(milestone => <tr key={milestone.title}><td>{milestone.title}</td><td>{milestone.date}</td><td>{milestone.status}</td></tr>)}</tbody></table></div> : <p>No milestones are included in this sample project.</p>}</section><section className="record-section"><h2>Shared update</h2>{project.company_id === '1' ? <p>The design direction is approved and the build is underway. Next, we’ll review the responsive experience together and prepare the launch checklist.</p> : <p>No shared updates are included in this sample project.</p>}</section></AppShell>;
}

