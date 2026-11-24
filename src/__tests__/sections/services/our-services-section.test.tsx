import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import OurServicesSection from "@/sections/services/our-services-section";

// Mock ServicesCard
jest.mock("@/components/ui/services-card", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

// Mock heroicons
jest.mock("@heroicons/react/24/outline", () => ({
  ChevronLeftIcon: () => <svg data-testid="left-icon" />,
  ChevronRightIcon: () => <svg data-testid="right-icon" />,
}));

describe("OurServicesSection", () => {

  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024, // desktop → itemsPerPage = 3
    });
  });

  const renderWithEffect = async () => {
    // Ensures useEffect runs before expectations
    await act(async () => {
      render(<OurServicesSection />);
    });
  };

  it("renders the section title", async () => {
    await renderWithEffect();
    expect(screen.getByText("OUR SERVICES")).toBeInTheDocument();
    expect(screen.getByText("Explore Other Services")).toBeInTheDocument();
  });

  it("renders all services titles", async () => {
    await renderWithEffect();
    expect(screen.getByText("Web & Mobile Development")).toBeInTheDocument();
    expect(screen.getByText("Cloud Hosting & Infrastructure")).toBeInTheDocument();
    expect(screen.getByText("Cybersecurity Solutions")).toBeInTheDocument();
    expect(screen.getByText("Content & Affiliate Marketing")).toBeInTheDocument();
    expect(screen.getByText("Big Data & Analytics")).toBeInTheDocument();
    expect(screen.getByText("DevOps & Automation")).toBeInTheDocument();
  });

  it("navigates to next and previous slides", async () => {
    await renderWithEffect();

    const nextButton = screen.getAllByLabelText("Next slide")[0];
    const prevButton = screen.getAllByLabelText("Previous slide")[0];

    fireEvent.click(nextButton);
    fireEvent.click(prevButton);

    expect(screen.getByText("Web & Mobile Development")).toBeInTheDocument();
  });

  it("renders pagination dots and allows clicking", async () => {
    await renderWithEffect();

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Go to slide/i }).length).toBeGreaterThan(0);
    });

    const dots = screen.getAllByRole("button", { name: /Go to slide/i });

    fireEvent.click(dots[1]);
    fireEvent.click(dots[0]);

    expect(screen.getByText("Web & Mobile Development")).toBeInTheDocument();
  });
});
