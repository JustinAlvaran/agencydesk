import {describe, expect, it} from 'vitest';
import {overviewPreview} from '@/lib/workspace-overview';
import {demoDashboard} from '@/lib/fixtures';

describe('bounded workspace previews', () => {
  it('excludes closed and archived leads without deriving global metrics from a page', () => {
    const input = {...demoDashboard, openLeads: 170, leads: [{...demoDashboard.leads[0], id:'archived', archived_at:'2026-10-01'}, ...demoDashboard.leads.slice(4), ...demoDashboard.leads.slice(0,4)]};
    expect(overviewPreview(input).leads.map(lead => lead.id)).toEqual(['1','2','3','4']);
    expect(input.openLeads).toBe(170);
  });
  it('shows an empty project preview when loaded projects are all inactive', () => {
    expect(overviewPreview({...demoDashboard, projects:demoDashboard.projects.map(project => ({...project,status:'completed'}))}).projects).toEqual([]);
  });
  it('sorts open tasks by due instant, keeping undated tasks last and preserving input', () => {
    const task=demoDashboard.tasks[0];
    const tasks=[{...task,id:'undated',due_at:null},{...task,id:'later',due_at:'2026-10-04T10:00:00Z'},{...task,id:'done',completed_at:'2026-10-01'},{...task,id:'earlier',due_at:'2026-10-02T10:00:00Z'}];
    expect(overviewPreview({...demoDashboard,tasks}).tasks.map(item => item.id)).toEqual(['earlier','later','undated']);
    expect(tasks.map(item => item.id)).toEqual(['undated','later','done','earlier']);
  });
  it('handles zero records and bounds each visible list', () => {
    expect(overviewPreview({...demoDashboard,leads:[],tasks:[],projects:[]})).toEqual({leads:[],tasks:[],projects:[]});
    const tasks=Array.from({length:8},(_,i)=>({...demoDashboard.tasks[0],id:String(i)}));
    expect(overviewPreview({...demoDashboard,tasks}).tasks).toHaveLength(4);
  });
});
