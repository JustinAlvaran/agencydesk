import React from 'react';
import { render, screen } from '@testing-library/react';
import BigDataAnalyticsPage, { generateMetadata } from '@/app/services/big-data-analytics/page';

/* ---------- mocks ---------- */
jest.mock('@/utils/getServiceDetailSSG', () => ({
  getServiceDetailSSG: jest.fn(() =>
    Promise.resolve({
      heroTitle: 'Big Data Analytics',
      heroSubtitle: 'Turn data into insights',
      main_image: '/data.jpg',
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
describe('BigDataAnalyticsPage', () => {
  it('renders all sections and calls getServiceDetailSSG with correct slug', async () => {
    const { getServiceDetailSSG } = await import('@/utils/getServiceDetailSSG');

    render(await BigDataAnalyticsPage());

    expect(getServiceDetailSSG).toHaveBeenCalledWith('big-data-analytics');
    expect(screen.getByTestId('service-detail')).toBeInTheDocument();
    expect(screen.getByTestId('why-choose')).toBeInTheDocument();
    expect(screen.getByTestId('stage-process')).toBeInTheDocument();
    expect(screen.getByTestId('our-services')).toBeInTheDocument();
    expect(screen.getByTestId('contact')).toBeInTheDocument();
  });

  it('generateMetadata returns correct shape', async () => {
    const meta = await generateMetadata();
    expect(meta).toEqual({
      title: 'Big Data Analytics | AgencyDesk',
      description: 'Turn data into insights',
      openGraph: {
        title: 'Big Data Analytics',
        description: 'Turn data into insights',
        images: ['/data.jpg'],
      },
    });
  });
});