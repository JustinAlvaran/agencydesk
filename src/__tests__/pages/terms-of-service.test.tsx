import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TermsOfServicePage, { generateMetadata } from '@/app/terms-of-service/page';
import { getSEOMetadata } from '@/utils/seoMetadata';

// 1. Mock the SEO utility
jest.mock('@/utils/seoMetadata', () => ({
  getSEOMetadata: jest.fn(),
}));

// 2. Mock the Hero Component
jest.mock('@/components/ui/terms-of-service-hero', () => {
  return function DummyHero() {
    return <div data-testid="tos-hero">Hero Component</div>;
  };
});

// 3. Mock the Button Component
// This avoids issues with UI library internals and keeps the DOM clean.
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

describe('TermsOfServicePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMetadata', () => {
    it('calls getSEOMetadata with correct parameters', async () => {
      await generateMetadata();
      expect(getSEOMetadata).toHaveBeenCalledTimes(1);
      expect(getSEOMetadata).toHaveBeenCalledWith('citc-ph.com', '/terms-of-service');
    });
  });

  describe('Component Rendering', () => {
    it('renders the hero component', () => {
      render(<TermsOfServicePage />);
      expect(screen.getByTestId('tos-hero')).toBeInTheDocument();
    });

    it('renders the welcome introduction text', () => {
      render(<TermsOfServicePage />);
      expect(screen.getByText(/Welcome to Cornerstone International Technologies/i)).toBeInTheDocument();
    });

    it('renders all numbered section headers', () => {
      render(<TermsOfServicePage />);

      const sections = [
        '1. Acceptance of Terms',
        '2. Use of Service',
        '3. Accounts & Security',
        '4. Intellectual Property',
        '5. Third-Party Services',
        '6. Termination',
        '7. Governing Law',
        '8. Changes to Terms',
        '9. Contact Us'
      ];

      sections.forEach((sectionTitle) => {
        // We use getByRole 'heading' to ensure semantically correct HTML (h1-h6)
        expect(screen.getByRole('heading', { name: sectionTitle })).toBeInTheDocument();
      });
    });

    it('states the governing law is Philippines', () => {
      render(<TermsOfServicePage />);
      // Specific check to ensure the hardcoded location is correct
      expect(screen.getByText(/laws of the Philippines/i)).toBeInTheDocument();
    });

    it('renders the custom bullet points', () => {
      render(<TermsOfServicePage />);
      
      const elements = screen.getAllByText(/maintaining the confidentiality of your account/i);
      
      expect(elements.length).toBeGreaterThan(0);
      
      expect(screen.getByText(/Notify us immediately/i)).toBeInTheDocument();
    });

    it('renders the contact email link correctly', () => {
      render(<TermsOfServicePage />);
      
      const emailLink = screen.getByRole('link', { name: /privacy@citc-ph.com/i });
      
      expect(emailLink).toBeInTheDocument();
      expect(emailLink).toHaveAttribute('href', 'mailto:privacy@citc-ph.com');
    });

    it('renders the Privacy Policy navigation button', () => {
      render(<TermsOfServicePage />);

      // Use getByRole 'link' because Next.js <Link> renders an <a> tag.
      // The name matches the text inside the Button: "See our Privacy Policy"
      const privacyLink = screen.getByRole('link', { name: /see our privacy policy/i });
      
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
    });
    
    it('renders the background decorative elements', () => {
        // Optional: Check if the main wrapper exists by checking a unique class
        // or simply that the page renders without crashing.
        const { container } = render(<TermsOfServicePage />);
        
        // Check for the gradient background classes
        // Note: checking classes is brittle, but sometimes necessary for visual logic
        expect(container.firstChild).toHaveClass('min-h-screen');
    });
  });
});