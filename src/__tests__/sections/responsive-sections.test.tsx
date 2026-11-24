import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import AboutUsSection from "@/sections/home/aboutus-section";
import MissionVisionSection from "@/sections/home/mission-vision-section";
import ServicesSection from "@/sections/home/services-section";
import CommunitySection from "@/sections/home/community-section";
import JoinUsSection from "@/sections/home/joinus-section";
import Hero from "@/sections/home/hero";
import { ImageProps } from "next/image";

// Mock next/themes
jest.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: jest.fn(),
  }),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: ImageProps) => {
    // Spread only the necessary img props to avoid type conflicts
    return <img src={props.src as string} alt={props.alt} width={props.width} height={props.height} />;
  },
}));

// Mock fetch function
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      data: [
        {
          id: "1",
          title: "Software Engineer",
          employment_type: "Full-time",
          field: "Engineering",
        },
      ],
    }),
  })
) as jest.Mock;

// Mock viewport size
const setViewportSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
  window.dispatchEvent(new Event('resize'));
};

describe("Page Sections Responsive Tests", () => {
  // Test Hero section
  describe("Hero Section", () => {
    it("renders correctly on desktop", () => {
      setViewportSize(1200, 800);
      render(<Hero />);
      
      // Check main heading
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(/Next-Gen Agency CRM & Digital Workspace/i);

      // Check subheading
      expect(screen.getByText(/AgencyDesk unites client lead capture, versioned scopes, agreed pricing, milestone delivery, and real-time CRM tracking into one seamless platform/i)).toBeInTheDocument();

      // Check feature points
      expect(screen.getByText(/Capture & Qualify/i)).toBeInTheDocument();
      expect(screen.getByText(/Scope & Agree/i)).toBeInTheDocument();
      expect(screen.getByText(/Deliver & Scale/i)).toBeInTheDocument();

      // Check CTA button
      expect(screen.getByText(/Start inquiry/i)).toBeInTheDocument();
    });

    it("renders correctly on mobile", () => {
      setViewportSize(375, 667);
      render(<Hero />);
      
      // Check main heading
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(/Next-Gen Agency CRM & Digital Workspace/i);

      // Check subheading
      expect(screen.getByText(/AgencyDesk unites client lead capture, versioned scopes, agreed pricing, milestone delivery, and real-time CRM tracking into one seamless platform/i)).toBeInTheDocument();

      // Check feature points
      expect(screen.getByText(/Capture & Qualify/i)).toBeInTheDocument();
      expect(screen.getByText(/Scope & Agree/i)).toBeInTheDocument();
      expect(screen.getByText(/Deliver & Scale/i)).toBeInTheDocument();

      // Check CTA button
      expect(screen.getByText(/Start inquiry/i)).toBeInTheDocument();
    });
  });

  // Test AboutUs section
  describe("AboutUs Section", () => {
    it("renders correctly on desktop", () => {
      setViewportSize(1200, 800);
      render(<AboutUsSection />);
      expect(screen.getByText(/Radical Transparency in Agency Operations/i)).toBeInTheDocument();
      expect(screen.getByText(/100%/i)).toBeInTheDocument();
      expect(screen.getByText(/Fixed-Scope Clarity/i)).toBeInTheDocument();
    });

    it("renders correctly on mobile", () => {
      setViewportSize(375, 667);
      render(<AboutUsSection />);
      expect(screen.getByText(/Radical Transparency in Agency Operations/i)).toBeInTheDocument();
      expect(screen.getByText(/100%/i)).toBeInTheDocument();
      expect(screen.getByText(/Fixed-Scope Clarity/i)).toBeInTheDocument();
    });
  });

  // Test MissionVision section
  describe("MissionVision Section", () => {
    it("renders correctly on desktop", () => {
      setViewportSize(1200, 800);
      render(<MissionVisionSection />);
      expect(screen.getByText(/Our Mission/i)).toBeInTheDocument();
      expect(screen.getByText(/Our Vision/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Read More/i)[0]).toBeInTheDocument();
    });

    it("renders correctly on mobile", () => {
      setViewportSize(375, 667);
      render(<MissionVisionSection />);
      expect(screen.getByText(/Our Mission/i)).toBeInTheDocument();
      expect(screen.getByText(/Our Vision/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Read More/i)[0]).toBeInTheDocument();
    });
  });

  // Test Services section
  describe("Services Section", () => {
    it("renders correctly on desktop", () => {
      setViewportSize(1200, 800);
      render(<ServicesSection />);
      expect(screen.getByText(/Web & Mobile Development/i)).toBeInTheDocument();
      expect(screen.getByText(/Cloud Hosting & Infrastructure/i)).toBeInTheDocument();
      expect(screen.getByText(/Cybersecurity Solutions/i)).toBeInTheDocument();
      expect(screen.getByText(/Content & Affiliate marketing/i)).toBeInTheDocument();
      expect(screen.getByText(/Big Data & Analytics/i)).toBeInTheDocument();
      expect(screen.getByText(/Devops & Automation/i)).toBeInTheDocument();
      expect(screen.getByText(/AI, Automation & R&D/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Learn More/i)[0]).toBeInTheDocument();
    });

    it("renders correctly on mobile", () => {
      setViewportSize(375, 667);
      render(<ServicesSection />);
      expect(screen.getByText(/Web & Mobile Development/i)).toBeInTheDocument();
      expect(screen.getByText(/Cloud Hosting & Infrastructure/i)).toBeInTheDocument();
      expect(screen.getByText(/Cybersecurity Solutions/i)).toBeInTheDocument();
      expect(screen.getByText(/Content & Affiliate marketing/i)).toBeInTheDocument();
      expect(screen.getByText(/Big Data & Analytics/i)).toBeInTheDocument();
      expect(screen.getByText(/Devops & Automation/i)).toBeInTheDocument();
      expect(screen.getByText(/AI, Automation & R&D/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Learn More/i)[0]).toBeInTheDocument();
    });
  });

  // Test Community section
  describe("Community Section", () => {
    it("renders correctly on desktop", () => {
      setViewportSize(1200, 800);
      render(<CommunitySection />);
      expect(screen.getByText(/Ready to Accelerate Your/i)).toBeInTheDocument();
      expect(screen.getByText(/Agency Workflow/i)).toBeInTheDocument();
      expect(screen.getByText(/Start Project Inquiry/i)).toBeInTheDocument();
    });

    it("renders correctly on mobile", () => {
      setViewportSize(375, 667);
      render(<CommunitySection />);
      expect(screen.getByText(/Ready to Accelerate Your/i)).toBeInTheDocument();
      expect(screen.getByText(/Agency Workflow/i)).toBeInTheDocument();
      expect(screen.getByText(/Start Project Inquiry/i)).toBeInTheDocument();
    });
  });

  // Test JoinUs section
  describe("JoinUs Section", () => {
    beforeEach(() => {
      // Clear mock before each test
      (global.fetch as jest.Mock).mockClear();
    });

    it("renders correctly on desktop", async () => {
      setViewportSize(1200, 800);
      
      await act(async () => {
        render(<JoinUsSection />);
      });

      expect(screen.getByText(/Apply Now/i)).toBeInTheDocument();
      expect(screen.getByText(/Tell us about yourself/i)).toBeInTheDocument();
    });

    it("renders correctly on mobile", async () => {
      setViewportSize(375, 667);
      
      await act(async () => {
        render(<JoinUsSection />);
      });

      expect(screen.getByText(/Apply Now/i)).toBeInTheDocument();
      expect(screen.getByText(/Tell us about yourself/i)).toBeInTheDocument();
    });
  });
});