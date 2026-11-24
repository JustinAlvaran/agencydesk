import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrivacyPolicyPage, { generateMetadata } from '@/app/privacy-policy/page';
import { getSEOMetadata } from '@/utils/seoMetadata';

// 1. Mock the SEO utility
jest.mock('@/utils/seoMetadata', () => ({
  getSEOMetadata: jest.fn(),
}));

// 2. Mock the Child Component (Hero)
// This ensures we only test the Page logic, not the Hero's internal logic.
jest.mock('@/components/ui/privacy-policy-hero', () => {
  return function DummyHero() {
    return <div data-testid="privacy-policy-hero">Hero Component</div>;
  };
});

// 3. Mock Lucide Icons to keep the DOM output clean
jest.mock('lucide-react', () => ({
  CheckCircle: () => <svg data-testid="icon-check-circle" />,
}));

describe('PrivacyPolicyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMetadata', () => {
    it('calls getSEOMetadata with correct parameters', async () => {
      // Act
      await generateMetadata();

      // Assert
      expect(getSEOMetadata).toHaveBeenCalledTimes(1);
      expect(getSEOMetadata).toHaveBeenCalledWith('citc-ph.com', '/privacy-policy');
    });
  });

  describe('Component Rendering', () => {
    it('renders the hero component', () => {
      render(<PrivacyPolicyPage />);
      expect(screen.getByTestId('privacy-policy-hero')).toBeInTheDocument();
    });

    it('renders the main title and effective date', () => {
      render(<PrivacyPolicyPage />);
      
      // Look for H1 specifically
      const mainHeading = screen.getByRole('heading', { level: 1, name: /privacy policy/i });
      expect(mainHeading).toBeInTheDocument();

      // Check effective date
      expect(screen.getByText(/Effective Date: July 1, 2025/i)).toBeInTheDocument();
    });

    it('renders all key section headings', () => {
      render(<PrivacyPolicyPage />);

      const sections = [
        'Information We Collect',
        'How We Use Your Information',
        'Cookies & Tracking',
        'Third-Party Services',
        'Your Rights',
        'Updates to This Policy',
        'Contact Us'
      ];

      sections.forEach((sectionTitle) => {
        expect(screen.getByRole('heading', { name: sectionTitle })).toBeInTheDocument();
      });
    });

    it('renders the contact email links with correct mailto attributes', () => {
      render(<PrivacyPolicyPage />);

      // There are two email links in the code
      const emailLinks = screen.getAllByRole('link', { name: /privacy@citc-ph.com/i });
      
      expect(emailLinks.length).toBeGreaterThan(0);
      emailLinks.forEach(link => {
        expect(link).toHaveAttribute('href', 'mailto:privacy@citc-ph.com');
      });
    });

    it('renders the Terms of Service link correctly', () => {
      render(<PrivacyPolicyPage />);

      const termsLink = screen.getByRole('link', { name: /view our terms/i });
      
      expect(termsLink).toBeInTheDocument();
      expect(termsLink).toHaveAttribute('href', '/terms-of-service');
    });

    it('renders the company name correctly within the article', () => {
      render(<PrivacyPolicyPage />);
      
      // Using a regex matcher to find text across elements if needed, 
      // or just checking partial text existence
      const elements = screen.getAllByText(/Cornerstone International Technologies/i);

      expect(elements.length).toBeGreaterThan(0);
    });
    
    it('renders check icons in the lists', () => {
        render(<PrivacyPolicyPage />);
        // Since we mocked CheckCircle to render <svg data-testid="icon-check-circle" />
        const icons = screen.getAllByTestId('icon-check-circle');
        expect(icons.length).toBeGreaterThan(0);
    });
  });
});