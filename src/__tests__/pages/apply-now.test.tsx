import React from 'react';
import { render, screen } from '@testing-library/react';
import ApplyNowPage from '@/app/apply-now/page';

// --- Mock the three sections so we can detect them --------------------------
jest.mock('@/sections/home/joinus-section', () => ({
  __esModule: true,
  default: () => <div data-testid="join-us-section" />,
}));

jest.mock('@/sections/home/benefits-section', () => ({
  __esModule: true,
  default: () => <div data-testid="benefits-section" />,
}));

jest.mock('@/sections/home/newsletter-section', () => ({
  __esModule: true,
  default: () => <div data-testid="newsletter-section" />,
}));

describe('ApplyNowPage', () => {
  it('renders all three sub-sections', () => {
    render(<ApplyNowPage />);

    expect(screen.getByTestId('join-us-section')).toBeInTheDocument();
    expect(screen.getByTestId('benefits-section')).toBeInTheDocument();
    expect(screen.getByTestId('newsletter-section')).toBeInTheDocument();
  });
});