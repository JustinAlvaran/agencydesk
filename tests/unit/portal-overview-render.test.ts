import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {PortalOverview} from '@/components/portal-overview';
import {demoProjects,demoProposals} from '@/lib/fixtures';

describe('client portal presentation',()=>{
  it('shows explicit empty states without injecting fictional records into a live view',()=>{
    const html=renderToStaticMarkup(createElement(PortalOverview,{projects:[],proposals:[],readOnly:false}));
    expect(html).toContain('No projects yet');
    expect(html).toContain('No shared proposals');
    expect(html).not.toContain('Forma');
    expect(html).not.toContain('/demo');
  });
  it('renders only provided projects and shared proposals with the correct live links',()=>{
    const html=renderToStaticMarkup(createElement(PortalOverview,{projects:[demoProjects[0]],proposals:[demoProposals[0],demoProposals[2]],readOnly:false}));
    expect(html).toContain('href="/portal/projects/1"');
    expect(html).toContain('href="/portal/proposals/1"');
    expect(html).not.toContain('/projects/2');
    expect(html).not.toContain('Ember brand');
  });
  it('omits unavailable progress and price rather than inventing values',()=>{
    const {progress,...project}=demoProjects[0];void progress;
    const {total_cents,...proposal}=demoProposals[0];void total_cents;
    const html=renderToStaticMarkup(createElement(PortalOverview,{projects:[project],proposals:[proposal],readOnly:true}));
    expect(html).not.toContain('<progress');
    expect(html).not.toContain('$0');
    expect(html).toContain('href="/demo/portal/projects/1"');
  });
});
