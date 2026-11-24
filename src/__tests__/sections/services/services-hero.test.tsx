import { render, screen } from "@testing-library/react";
import ServicesHero from "@/sections/services/services-hero";
import React from "react";

// Mock Next.js Image component
jest.mock("next/image", () => (props: any) => <img {...props} />);

describe("ServicesHero component", () => {
  const props = {
    icon: "/icons/service.svg",
    title: "Custom Title",
    subtitle: "Custom Subtitle",
    backgroundImage: "/images/bg.jpg",
  };

  it("renders the main section", () => {
    render(<ServicesHero {...props} />);
    const section = screen.getByRole("region") || screen.getByTestId("services-hero-section");
    // Since section has no role, fallback to testId (add it in component if needed)
    expect(section).toBeInTheDocument();
  });

  it("renders the icon image", () => {
    render(<ServicesHero {...props} />);
    const icon = screen.getByAltText("service icon");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("src", props.icon);
  });

  it("renders the background image", () => {
    render(<ServicesHero {...props} />);
    const bg = screen.getByAltText("background image");
    expect(bg).toBeInTheDocument();
    expect(bg).toHaveAttribute("src", props.backgroundImage);
  });

  it("renders title and subtitle", () => {
    render(<ServicesHero {...props} />);
    expect(screen.getByText(props.title)).toBeInTheDocument();
    expect(screen.getByText(props.subtitle)).toBeInTheDocument();
  });

  it("renders default title and subtitle if props not provided", () => {
    render(<ServicesHero icon="/icons/service.svg" backgroundImage="/images/bg.jpg" title="" subtitle="" />);
    expect(screen.getByText("Web & Mobile Development")).toBeInTheDocument();
    expect(screen.getByText("Smart, scalable, and user-first digital platforms that drive results")).toBeInTheDocument();
  });
});
