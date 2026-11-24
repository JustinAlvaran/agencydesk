import { render, screen } from "@testing-library/react";
import WhyChooseUs from "@/sections/services/why-choose-us";
import React from "react";

// Mock Next.js Image component
jest.mock("next/image", () => (props: any) => <img {...props} />);

// Mock FeaturesCard to simplify testing
jest.mock("@/components/ui/features-card", () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="features-card">{props.title}</div>,
}));

describe("WhyChooseUs component", () => {
  it("renders the main section", () => {
    render(<WhyChooseUs />);
    const section = screen.getByTestId("why-choose-us-section");
    expect(section).toBeInTheDocument();
  });

  it("renders the heading", () => {
    render(<WhyChooseUs />);
    const heading = screen.getByRole("heading", { name: /our competitive edge/i });
    expect(heading).toBeInTheDocument();
  });

  it("renders all FeaturesCard components", () => {
    render(<WhyChooseUs />);
    const cards = screen.getAllByTestId("features-card");
    expect(cards.length).toBe(6); // There are 6 items in competitiveEdgeData
  });

  it("renders all feature titles", () => {
    render(<WhyChooseUs />);
    const titles = [
      "Proven Track Record",
      "Tailored Solutions",
      "Client-Centric Focus",
      "Transparent Communication",
      "Dedicated Support",
      "Expertise Among Industries",
    ];

    titles.forEach(title => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });
});
