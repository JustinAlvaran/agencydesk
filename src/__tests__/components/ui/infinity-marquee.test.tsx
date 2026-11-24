import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { InfiniteMarquee } from "@/components/ui/infinity-marquee";
import type { ImgHTMLAttributes } from "react";

// Mock Next.js Image component
jest.mock("next/image", () => {
  const MockNextImage = (props: ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  };
  MockNextImage.displayName = "MockNextImage";
  return MockNextImage;
});

describe("InfiniteMarquee", () => {
  it("renders all company logos twice", () => {
    render(<InfiniteMarquee />);

    const testCompanies = [
      "Google",
      "Meta",
      "Intel",
      "Microsoft",
      "GitHub",
      "IBM",
      "Oracle",
      "Adobe",
      "HubSpot",
      "QuickBooks",
      "Apollo.io",
      "n8n",
      "GoHighLevel",
      "Twilio",
      "Dialpad",
      "Slack",
      "Asana",
      "Dropbox",
      "Zapier",
      "Make",
      "Claude",
      "Manus AI",
      "BuilderTrend",
      "The In-House App",
    ];

    testCompanies.forEach((company) => {
      const logos = screen.getAllByAltText(`${company} logo`);
      expect(logos.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("applies marquee and container classes", () => {
    render(<InfiniteMarquee />);

    const container = document.querySelector("div.w-full.overflow-hidden");
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass("backdrop-blur-xl");

    const marquee = document.querySelector(".animate-marquee");
    expect(marquee).toBeInTheDocument();
  });
});
