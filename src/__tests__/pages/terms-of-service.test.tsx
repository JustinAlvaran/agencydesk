import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TermsOfServicePage, { generateMetadata } from '@/app/terms-of-service/page';
import { getSEOMetadata } from '@/utils/seoMetadata';

jest.mock('@/utils/seoMetadata', () => ({
  getSEOMetadata: jest.fn(),
}));

describe('TermsOfServicePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMetadata', () => {
    it('calls getSEOMetadata with AgencyDesk domain and /terms-of-service slug', async () => {
      await generateMetadata();
      expect(getSEOMetadata).toHaveBeenCalledTimes(1);
      expect(getSEOMetadata).toHaveBeenCalledWith('agencydesk-theta.vercel.app', '/terms-of-service');
    });
  });

  describe('Component Rendering', () => {
    it('renders the main title and AgencyDesk welcome text', () => {
      render(<TermsOfServicePage />);
      expect(screen.getByRole('heading', { level: 1, name: /terms of service/i })).toBeInTheDocument();
      expect(screen.getByText(/Effective Date: November 27, 2026 · AgencyDesk/i)).toBeInTheDocument();
      expect(screen.getByText(/Welcome to/i)).toBeInTheDocument();
    });

    it('renders all numbered section headers', () => {
      render(<TermsOfServicePage />);
      const sections = [
        '1. Agency Engagements & Fixed-Price Proposals',
        '2. Client Portal Approvals & Workspace Accounts',
        '3. Acceptable Use',
        '4. Intellectual Property',
        '5. Limitation of Liability',
        '6. Changes & Contact',
      ];
      sections.forEach((sectionTitle) => {
        expect(screen.getByRole('heading', { name: sectionTitle })).toBeInTheDocument();
      });
    });

    it('renders the AgencyDesk contact email and navigation links', () => {
      render(<TermsOfServicePage />);
      const emailLinks = screen.getAllByRole('link', { name: /inquiries@agencydesk\.dev/i });
      expect(emailLinks.length).toBeGreaterThan(0);
      emailLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', 'mailto:inquiries@agencydesk.dev');
      });

      const privacyLink = screen.getByRole('link', { name: /read privacy policy/i });
      expect(privacyLink).toHaveAttribute('href', '/privacy-policy');

      const bookLink = screen.getByRole('link', { name: /book discovery call/i });
      expect(bookLink).toHaveAttribute('href', '/book');
    });
  });
});
