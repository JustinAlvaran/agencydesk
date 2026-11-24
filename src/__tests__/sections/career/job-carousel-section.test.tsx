import { render, screen, fireEvent } from "@testing-library/react";
import JobCarouselSection from "@/sections/career/job-carousel-section";
import React from "react";

// Mock useJobList hook
jest.mock('@/hooks/useJobList', () => ({
  useJobList: jest.fn(() => ({
    jobs: [
      { id: '1', title: 'Software Engineer', field: 'Engineering', description: 'Job desc', employment_type: 'Full-time', location: 'Remote', level: 'Mid' },
      { id: '2', title: 'Product Manager', field: 'Product', description: 'Job desc', employment_type: 'Full-time', location: 'Remote', level: 'Senior' },
    ],
    loading: false,
    error: null,
  }))
}));

// Mock Carousel components
jest.mock('@/components/ui/carousel', () => ({
  Carousel: ({ children }: any) => <div>{children}</div>,
  CarouselContent: ({ children }: any) => <div>{children}</div>,
  CarouselItem: ({ children }: any) => <div>{children}</div>,
  CarouselNext: () => <button>Next</button>,
  CarouselPrevious: () => <button>Previous</button>,
}));

// Mock CareerCard
jest.mock('@/components/ui/career-card', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="career-card">{props.title}</div>,
}));

// Mock Button
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

// Mock Loader
jest.mock('@/components/ui/loader', () => ({
  __esModule: true,
  default: () => <div>Loading...</div>,
}));

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe("JobCarouselSection component", () => {
  it("renders the heading", () => {
    render(<JobCarouselSection />);
    expect(screen.getByText(/Discover Other Openings/i)).toBeInTheDocument();
  });

  it("renders all CareerCard components", () => {
    render(<JobCarouselSection />);
    const cards = screen.getAllByTestId("career-card");
    expect(cards.length).toBe(2); // Matches mocked careers length
  });

  it("renders Browse All button", () => {
    render(<JobCarouselSection />);
    const button = screen.getByText(/BROWSE ALL/i);
    expect(button).toBeInTheDocument();
  });

  it("renders Next and Previous buttons", () => {
    render(<JobCarouselSection />);
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.getByText("Previous")).toBeInTheDocument();
  });
});