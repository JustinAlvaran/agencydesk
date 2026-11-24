import { render, screen, fireEvent } from "@testing-library/react";
import CareerHeroSection from "@/sections/career/career-hero-section";
import React from "react";

// ✅ Define proper types for mock props
interface ImageProps {
  src: string;
  alt: string;
  [key: string]: unknown;
}

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
}

// ✅ Mock Next.js Image properly with display name
jest.mock("next/image", () => {
  const MockNextImage = (props: ImageProps) => (
    // ⚠️ You can ignore the Next.js LCP and alt warnings in tests
    // because Jest doesn’t actually render to the DOM
    // (this is just a placeholder)
    <img {...props} alt={props.alt || "Mock image"} />
  );
  MockNextImage.displayName = "MockNextImage";
  return MockNextImage;
});

// ✅ Mock SearchBar with explicit prop types and display name
jest.mock("@/components/ui/search-bar", () => ({
  __esModule: true,
  default: (props: SearchBarProps) => {
    const MockSearchBar = () => (
      <div>
        <button onClick={() => props.onSearch("test")}>Search</button>
        <button onClick={props.onClear}>Clear</button>
      </div>
    );
    MockSearchBar.displayName = "MockSearchBar";
    return <MockSearchBar />;
  },
}));

describe("CareerHeroSection component", () => {
  const props = {
    headline: "Join Our Team",
    subheadline: "Grow your career with us",
    heroImage: "/images/career-hero.jpg",
    onSearch: jest.fn(),
    onClear: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders headline and subheadline", () => {
    render(<CareerHeroSection {...props} />);
    expect(screen.getByText("Join Our")).toBeInTheDocument();
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText(props.subheadline)).toBeInTheDocument();
  });

  it("renders background image", () => {
    render(<CareerHeroSection {...props} />);
    const img = screen.getByAltText("Career Hero Section Background Image");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", props.heroImage);
  });

  it("calls onSearch when Search button is clicked", () => {
    render(<CareerHeroSection {...props} />);
    fireEvent.click(screen.getByText("Search"));
    expect(props.onSearch).toHaveBeenCalledWith("test");
  });

  it("calls onClear when Clear button is clicked", () => {
    render(<CareerHeroSection {...props} />);
    fireEvent.click(screen.getByText("Clear"));
    expect(props.onClear).toHaveBeenCalled();
  });
});
