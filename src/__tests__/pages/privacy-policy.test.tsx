import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrivacyPolicyPage, { generateMetadata } from '@/app/privacy-policy/page';
import { getSEOMetadata } from '@/utils/seoMetadata';

jest.mock('@/utils/seoMetadata', () => ({
  getSEOMetadata: jest.fn(),
}));

describe('PrivacyPolicyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMetadata', () => {
    it('calls getSEOMetadata with AgencyDesk domain and /privacy-policy slug', async () => {
      await generateMetadata();
      expect(getSEOMetadata).toHaveBeenCalledTimes(1);
      expect(getSEOMetadata).toHaveBeenCalledWith('agencydesk-theta.vercel.app', '/privacy-policy');
    });
  });

  describe('Component Rendering', () => {
    it('renders the main title and AgencyDesk effective date', () => {
      render(<PrivacyPolicyPage />);
      expect(screen.getByRole('heading', { level: 1, name: /privacy policy/i })).toBeInTheDocument();
      expect(screen.getByText(/Effective Date: November 27, 2026 · AgencyDesk/i)).toBeInTheDocument();
    });

    it('renders all key section headings', () => {
      render(<PrivacyPolicyPage />);
      const sections = [
        '1. Information We Collect',
        '2. WhatsApp & Email Opt-In / Opt-Out Consent',
        '3. Cookies & Supabase Authentication',
        '4. Infrastructure & Workflow Sub-Processors',
        '5. Your Access & Deletion Rights',
        '6. Contact Us',
      ];
      sections.forEach((sectionTitle) => {
        expect(screen.getByRole('heading', { name: sectionTitle })).toBeInTheDocument();
      });
    });

    it('renders the AgencyDesk contact email links and strict mobile data commitment', () => {
      render(<PrivacyPolicyPage />);
      const emailLinks = screen.getAllByRole('link', { name: /inquiries@agencydesk\.dev/i });
      expect(emailLinks.length).toBeGreaterThan(0);
      emailLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', 'mailto:inquiries@agencydesk.dev');
      });
      expect(screen.getByText(/Strict Mobile Data Commitment/i)).toBeInTheDocument();
    });

    it('renders the Terms of Service link correctly', () => {
      render(<PrivacyPolicyPage />);
      const termsLink = screen.getByRole('link', { name: /view terms of service/i });
      expect(termsLink).toBeInTheDocument();
      expect(termsLink).toHaveAttribute('href', '/terms-of-service');
    });
  });
});
