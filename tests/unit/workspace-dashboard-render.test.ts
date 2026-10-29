import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {DashboardView} from '@/components/workspace-dashboard';
import {demoDashboard} from '@/lib/fixtures';

describe('workspace overview data presentation',()=>{
  it('renders explicit empty states for zero leads/tasks and inactive-only projects',()=>{
    const html=renderToStaticMarkup(createElement(DashboardView,{readOnly:false,data:{...demoDashboard,leads:[],tasks:[],projects:demoDashboard.projects.map(project=>({...project,status:'completed'}))}}));
    expect(html).toContain('No open leads in this preview');
    expect(html).toContain('No open follow-ups in this preview');
    expect(html).toContain('No active projects in this preview');
    expect(html).not.toContain('Forma — digital launch');
  });
  it('preserves authoritative metrics and live route links even with empty previews',()=>{
    const html=renderToStaticMarkup(createElement(DashboardView,{readOnly:false,data:{...demoDashboard,leads:[],openLeads:170,pipelineValue:9000000}}));
    expect(html).toContain('170');expect(html).toContain('$90,000');
    expect(html).toContain('href="/crm/leads"');expect(html).not.toContain('href="/demo/');
  });
  it('does not invent progress when the live project has no progress field',()=>{
    const html=renderToStaticMarkup(createElement(DashboardView,{readOnly:false,data:{...demoDashboard,projects:demoDashboard.projects.map(({progress,...project})=>{void progress;return project;})}}));
    expect(html).not.toContain('% complete');
  });
  it('requires explicit data for a live dashboard instead of falling back to demo records',()=>{
    expect(()=>renderToStaticMarkup(createElement(DashboardView,{readOnly:false} as never))).toThrow('Workspace data is required');
  });
});
