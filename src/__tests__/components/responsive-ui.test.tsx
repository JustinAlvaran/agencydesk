// src/__tests__/components/responsive-ui.test.tsx
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ContactUsButton from "@/components/ui/contactus-button";
import ServicesCard from "@/components/ui/services-card";
import BlogCard from "@/components/ui/blog-card";
import CareerCard from "@/components/ui/career-card";
import { Input } from "@/components/ui/input";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage({ src, alt }: { src: string; alt: string }) {
    return <img src={src} alt={alt} />;
  },
}));

// Mock the Button component if used inside ServicesCard
jest.mock("@/components/ui/button", () => ({
  __esModule: true,
  Button: function MockButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
    return <button onClick={onClick}>{children}</button>;
  },
}));

// Mock useRouter for CareerCard
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Helper function to set viewport size
function setViewportSize(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: height });
  window.dispatchEvent(new Event("resize"));
}

describe("UI Components Responsive Tests", () => {
  // ContactUsButton
  describe("ContactUsButton", () => {
    it("renders correctly on desktop", () => {
      setViewportSize(1200, 800);
      render(<ContactUsButton />);
      const button = screen.getByText(/contact us/i);
      expect(button).toBeInTheDocument();
    });

    it("renders correctly on mobile", () => {
      setViewportSize(375, 667);
      render(<ContactUsButton />);
      const button = screen.getByText(/contact us/i);
      expect(button).toBeInTheDocument();
    });
  });

  // ServicesCard
  describe("ServicesCard", () => {
    const mockProps = {
      title: "Test Service",
      description: "This is a test service description",
      icon: "/services-icons/webmobile.webp",
      link: "/services/test",
    };

    it("renders correctly on desktop", () => {
      setViewportSize(1200, 800);
      render(<ServicesCard {...mockProps} />);
      expect(screen.getByText(mockProps.title)).toBeInTheDocument();
      expect(screen.getByText(mockProps.description)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /learn more/i })).toBeInTheDocument();
    });

    it("renders correctly on mobile", () => {
      setViewportSize(375, 667);
      render(<ServicesCard {...mockProps} />);
      expect(screen.getByText(mockProps.title)).toBeInTheDocument();
      expect(screen.getByText(mockProps.description)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /learn more/i })).toBeInTheDocument();
    });
  });

  // BlogCard
  describe("BlogCard", () => {
    const mockProps = {
      title: "Test Blog Post",
      tag: "Technology",
      date: "2023-05-15",
      link: "/blog/test-post",
    };

    it("renders correctly on desktop", () => {
      setViewportSize(1200, 800);
      render(<BlogCard {...mockProps} />);
      expect(screen.getByText(mockProps.tag.toUpperCase())).toBeInTheDocument();
      expect(screen.getByText(/read more/i)).toBeInTheDocument();
    });

    it("renders correctly on mobile", () => {
      setViewportSize(375, 667);
      render(<BlogCard {...mockProps} />);
      expect(screen.getByText(mockProps.tag.toUpperCase())).toBeInTheDocument();
      expect(screen.getByText(/read more/i)).toBeInTheDocument();
    });
  });

  // CareerCard
  describe("CareerCard", () => {
    const mockProps = {
      field: "Engineering",
      title: "Software Engineer",
      description: "We are looking for a skilled software engineer",
      employment_type: "Full-time",
      location: "Remote",
      level: "Mid-level",
    };

    it("renders correctly on desktop", () => {
      setViewportSize(1200, 800);
      render(<CareerCard id="" {...mockProps} />);
      expect(screen.getByText(mockProps.title)).toBeInTheDocument();
      expect(screen.getByText(mockProps.description)).toBeInTheDocument();
      expect(screen.getByText(mockProps.employment_type)).toBeInTheDocument();
      expect(screen.getByText(mockProps.location)).toBeInTheDocument();
    });

    it("renders correctly on mobile", () => {
      setViewportSize(375, 667);
      render(<CareerCard {...mockProps} id="test-career-card" />);
      expect(screen.getByText(mockProps.title)).toBeInTheDocument();
      expect(screen.getByText(mockProps.description)).toBeInTheDocument();
      expect(screen.getByText(mockProps.employment_type)).toBeInTheDocument();
      expect(screen.getByText(mockProps.location)).toBeInTheDocument();
    });
    });
  });

  // Input
  describe("Input", () => {
    it("renders correctly on desktop", () => {
      setViewportSize(1200, 800);
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText("Enter text");
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass("w-full");
    });

    it("renders correctly on mobile", () => {
      setViewportSize(375, 667);
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText("Enter text");
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass("w-full");
    });
    });
