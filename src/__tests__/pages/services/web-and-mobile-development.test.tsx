import React from 'react';
import { render, screen } from '@testing-library/react';
import WebAndMobileDevelopmentPage from '@/app/services/web-and-mobile-development/page';

/* ---------- mock the data fetcher ---------------------------------- */
jest.mock('@/utils/getServiceDetailSSG', () => ({
  getServiceDetailSSG: jest.fn(() =>
    Promise.resolve({
      heroTitle: 'Web & Mobile',
      heroSubtitle: 'We build apps',
      main_image: '/img.jpg',
    })
  ),
}));

/* ---------- mock every section so we can detect them --------------- */
jest.mock('@/sections/services/service-detail-section', () => ({
  __esModule: true,
  default: () => <div data-testid="service-detail" />,
}));

jest.mock('@/sections/services/why-choose-us', () => ({
  __esModule: true,
  default: () => <div data-testid="why-choose" />,
}));

jest.mock('@/sections/services/4-stage-process', () => ({
  __esModule: true,
  default: () => <div data-testid="stage-process" />,
}));

jest.mock('@/sections/services/our-services-section', () => ({
  __esModule: true,
  default: () => <div data-testid="our-services" />,
}));

jest.mock('@/sections/contact-section', () => ({
  ContactSection: () => <div data-testid="contact" />,
}));

/* ---------- test --------------------------------------------------- */
describe('WebAndMobileDevelopmentPage', () => {
  it('renders all sections and calls getServiceDetailSSG with correct slug', async () => {
    const { getServiceDetailSSG } = await import('@/utils/getServiceDetailSSG');

    render(await WebAndMobileDevelopmentPage());

    expect(getServiceDetailSSG).toHaveBeenCalledWith('web-and-mobile-development');

    expect(screen.getByTestId('service-detail')).toBeInTheDocument();
    expect(screen.getByTestId('why-choose')).toBeInTheDocument();
    expect(screen.getByTestId('stage-process')).toBeInTheDocument();
    expect(screen.getByTestId('our-services')).toBeInTheDocument();
    expect(screen.getByTestId('contact')).toBeInTheDocument();
  });
});