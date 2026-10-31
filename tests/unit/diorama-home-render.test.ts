import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import fixtures from '../../content/fixtures.json';
vi.mock('@/lib/website-content',()=>({websiteContent:fixtures,publicServices:fixtures.services.filter(service=>service.visibility==='visible')}));
import {LaunchHome} from '@/components/launch-home';
describe('cinematic homepage progressive enhancement',()=>{
 it('offers the 3D layer interaction and a meaningful static world before JavaScript runs',()=>{
  const html=renderToStaticMarkup(createElement(LaunchHome));
  expect(html).toContain('Open the layers');
  expect(html).toContain('Inquiry → proposal → delivery');
  expect(html).not.toContain('<canvas');
 });
 it('keeps the service proposition and direct inquiry available outside the world',()=>{
  const html=renderToStaticMarkup(createElement(LaunchHome));
  expect(html).toContain(fixtures.home_page.heading);
  expect(html).toContain('href="/inquire"');
  expect(html).toContain('Empty interface preview');
  expect(html).not.toContain('Maya Chen');
 });
});
