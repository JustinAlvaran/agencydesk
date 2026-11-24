import React from 'react';
import { render, screen } from '@testing-library/react';
import CybersecurityPage, { generateMetadata } from '@/app/services/cybersecurity/page';

/* ------------------ mocks ------------------ */
const mockDetail = {
  heroTitle: 'Cybersecurity',
  heroSubtitle: 'Protect your business',
  main_image: '/cyber.jpg',
};

jest.mock('@/utils/getServiceDetailSSG', () => ({
  getServiceDetailSSG: jest.fn(() => Promise.resolve(mockDetail)),
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
describe('CybersecurityPage', () => {
  it('renders all sections and calls getServiceDetailSSG with correct slug', async () => {
    const { getServiceDetailSSG } = await import('@/utils/getServiceDetailSSG');

    render(await CybersecurityPage());

    expect(getServiceDetailSSG).toHaveBeenCalledWith('cybersecurity');
    expect(screen.getByTestId('service-detail')).toBeInTheDocument();
    expect(screen.getByTestId('why-choose')).toBeInTheDocument();
    expect(screen.getByTestId('stage-process')).toBeInTheDocument();
    expect(screen.getByTestId('our-services')).toBeInTheDocument();
    expect(screen.getByTestId('contact')).toBeInTheDocument();
  });

  it('generateMetadata returns correct shape', async () => {
    const meta = await generateMetadata();

    expect(meta).toEqual({
      title: 'Cybersecurity | AgencyDesk',
      description: 'Protect your business',
      openGraph: {
        title: 'Cybersecurity',
        description: 'Protect your business',
        images: ['/cyber.jpg'],
      },
    });
  });
});