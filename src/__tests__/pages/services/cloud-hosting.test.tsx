import React from 'react';
import { render, screen } from '@testing-library/react';
import CloudHostingPage, { generateMetadata } from '@/app/services/cloud-hosting/page';

/* ------------------ mocks ------------------ */
jest.mock('@/utils/getServiceDetailSSG', () => ({
  getServiceDetailSSG: jest.fn(() =>
    Promise.resolve({
      heroTitle: 'Cloud Hosting',
      heroSubtitle: 'Scalable cloud infra',
      main_image: '/cloud.jpg',
    })
  ),
}));

jest.mock('@/utils/seoMetadata', () => ({
  getSEOMetadata: jest.fn(() =>
    Promise.resolve({
      title: 'Cloud Hosting | AgencyDesk',
      description: 'Scalable cloud infra',
    })
  ),
}));

jest.mock('@/sections/services/service-detail-section', () => {
  const MockServiceDetail = () => <div data-testid="service-detail" />;
  MockServiceDetail.displayName = 'MockServiceDetail';
  return MockServiceDetail;
});

jest.mock('@/sections/services/why-choose-us', () => {
  const MockWhyChoose = () => <div data-testid="why-choose" />;
  MockWhyChoose.displayName = 'MockWhyChoose';
  return MockWhyChoose;
});

jest.mock('@/sections/services/4-stage-process', () => {
  const MockStageProcess = () => <div data-testid="stage-process" />;
  MockStageProcess.displayName = 'MockStageProcess';
  return MockStageProcess;
});

jest.mock('@/sections/services/our-services-section', () => {
  const MockOurServices = () => <div data-testid="our-services" />;
  MockOurServices.displayName = 'MockOurServices';
  return MockOurServices;
});

jest.mock('@/sections/contact-section', () => {
  const MockContactSection = () => <div data-testid="contact" />;
  MockContactSection.displayName = 'MockContactSection';
  return { ContactSection: MockContactSection };
});

/* ------------------ tests ------------------ */
describe('CloudHostingPage', () => {
  it('renders all sections and calls getServiceDetailSSG with correct slug', async () => {
    const { getServiceDetailSSG } = await import('@/utils/getServiceDetailSSG');

    render(await CloudHostingPage());

    expect(getServiceDetailSSG).toHaveBeenCalledWith('cloud-hosting');
    expect(screen.getByTestId('service-detail')).toBeInTheDocument();
    expect(screen.getByTestId('why-choose')).toBeInTheDocument();
    expect(screen.getByTestId('stage-process')).toBeInTheDocument();
    expect(screen.getByTestId('our-services')).toBeInTheDocument();
    expect(screen.getByTestId('contact')).toBeInTheDocument();
  });

  it('generateMetadata calls getSEOMetadata with correct arguments', async () => {
    const { getSEOMetadata } = await import('@/utils/seoMetadata');

    const meta = await generateMetadata();

    expect(getSEOMetadata).toHaveBeenCalledWith('agencydesk-theta.vercel.app', '/services/cloud-hosting');
    expect(meta).toEqual({
      title: 'Cloud Hosting | AgencyDesk',
      description: 'Scalable cloud infra',
    });
  });
});