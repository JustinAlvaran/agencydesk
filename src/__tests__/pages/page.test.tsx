import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "@/app/page";

// Mock getStaticProps or data fetching utils if needed
jest.mock("@/utils/getJobsPosition", () => ({
  getStaticProps: jest.fn().mockResolvedValue({
    props: {
      careers: []
    }
  })
}));


jest.mock("@/sections/home/hero", () => {
  const Comp = () => <div data-testid="hero">hero</div>;
  Comp.displayName = "MockHero";
  return Comp;
});

jest.mock("@/components/ui/infinity-marquee", () => ({
  InfiniteMarquee: () => {
    const Comp = () => <div data-testid="marquee">marquee</div>;
    Comp.displayName = "MockMarquee";
    return <Comp />;
  }
}));

jest.mock("@/sections/home/features-section", () => {
  const Comp = () => <div data-testid="features">features</div>;
  Comp.displayName = "MockFeatures";
  return Comp;
});

jest.mock("@/sections/home/benefits-section", () => {
  const Comp = () => <div data-testid="benefits">benefits</div>;
  Comp.displayName = "MockBenefits";
  return Comp;
});

jest.mock("@/sections/home/services-section", () => {
  const Comp = () => <div data-testid="services">services</div>;
  Comp.displayName = "MockServices";
  return Comp;
});

jest.mock("@/sections/home/aboutus-section", () => {
  const Comp = () => <div data-testid="aboutus">aboutus</div>;
  Comp.displayName = "MockAboutUs";
  return Comp;
});

jest.mock("@/sections/home/mission-vision-section", () => {
  const Comp = () => <div data-testid="mission-vision">mission-vision</div>;
  Comp.displayName = "MockMissionVision";
  return Comp;
});

jest.mock("@/sections/home/community-section", () => {
  const Comp = () => <div data-testid="community">community</div>;
  Comp.displayName = "MockCommunity";
  return Comp;
});

jest.mock("@/sections/home/career-section", () => {
  const Comp = () => <div data-testid="jobs">career</div>;
  Comp.displayName = "MockCareer";
  return Comp;
});

jest.mock("@/sections/home/newsletter-section", () => {
  const Comp = () => <div data-testid="newsletter">newsletter</div>;
  Comp.displayName = "MockNewsletter";
  return Comp;
});

describe("Home", () => {
  it("renders Header and all sections", async () => {
    // 1. Resolve the async Server Component
    const ui = await Home();
    
    // 2. RENDER the result into the DOM
    render(ui); 

    // 3. Now screen queries will find the elements
    expect(screen.getByTestId("hero")).toBeInTheDocument();
    expect(screen.getByTestId("marquee")).toBeInTheDocument();
    expect(screen.getByTestId("features")).toBeInTheDocument();
    expect(screen.getByTestId("benefits")).toBeInTheDocument();
    expect(screen.getByTestId("services")).toBeInTheDocument();
    expect(screen.getByTestId("aboutus")).toBeInTheDocument();
    expect(screen.queryByTestId("mission-vision")).not.toBeInTheDocument();
    expect(screen.getByTestId("community")).toBeInTheDocument();
    expect(screen.queryByTestId("jobs")).not.toBeInTheDocument();
    expect(screen.getByTestId("newsletter")).toBeInTheDocument();
  });
});
