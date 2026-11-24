import React from 'react';
import { render, screen } from '@testing-library/react';
import ContentMarketingPage, { generateMetadata } from '@/app/services/content-marketing/page';

/* ---------- mocks ---------- */
jest.mock('@/utils/getServiceDetailSSG', () => ({
  getServiceDetailSSG: jest.fn(() =>
    Promise.resolve({
      heroTitle: 'Content Marketing',
      heroSubtitle: 'Engage your audience',
      main_image: '/cms.jpg',
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

/* ---------- tests ---------- */
describe('ContentMarketingPage', () => {
  it('renders all sections and calls getServiceDetailSSG with correct slug', async () => {
    const { getServiceDetailSSG } = await import('@/utils/getServiceDetailSSG');

    render(await ContentMarketingPage());

    expect(getServiceDetailSSG).toHaveBeenCalledWith('content-marketing');
    expect(screen.getByTestId('service-detail')).toBeInTheDocument();
    expect(screen.getByTestId('why-choose')).toBeInTheDocument();
    expect(screen.getByTestId('stage-process')).toBeInTheDocument();
    expect(screen.getByTestId('our-services')).toBeInTheDocument();
    expect(screen.getByTestId('contact')).toBeInTheDocument();
  });

  it('generateMetadata returns correct shape', async () => {
    const meta = await generateMetadata();
    expect(meta).toEqual({
      title: 'Content Marketing | AgencyDesk',
      description: 'Engage your audience',
      openGraph: {
        title: 'Content Marketing',
        description: 'Engage your audience',
        images: ['/cms.jpg'],
      },
    });
  });
});