import React from "react";
import { render } from "@testing-library/react";
import NicheSolutionsPage, { generateMetadata } from "@/app/services/devops-automation/page";
import { getServiceDetailSSG } from "@/utils/getServiceDetailSSG";
import { ServiceDetail } from "@/types/service-detail";

// Mock all sub-components to isolate testing
jest.mock("@/sections/services/service-detail-section", () => ({
  __esModule: true,
  default: ({ serviceDetail }: { serviceDetail: ServiceDetail }) => (
    <div data-testid="service-detail-section">{serviceDetail?.heroTitle}</div>
  ),
}));

jest.mock("@/sections/services/why-choose-us", () => ({
  __esModule: true,
  default: () => <div data-testid="why-choose-us">Why Choose Us</div>,
}));

jest.mock("@/sections/services/4-stage-process", () => ({
  __esModule: true,
  default: () => <div data-testid="four-stage-process">4 Stage Process</div>,
}));

jest.mock("@/sections/services/our-services-section", () => ({
  __esModule: true,
  default: () => <div data-testid="our-services-section">Our Services</div>,
}));

jest.mock("@/sections/contact-section", () => ({
  __esModule: true,
  ContactSection: () => <div data-testid="contact-section">Contact Section</div>,
}));

// Mock the getServiceDetailSSG utility
jest.mock("@/utils/getServiceDetailSSG");

const mockServiceDetail = {
  heroTitle: "Niche Solutions",
  heroSubtitle: "Empowering niche industries with tailored IT strategies",
  main_image: "/images/niche.jpg",
};

describe("NicheSolutionsPage", () => {
  beforeEach(() => {
    (getServiceDetailSSG as jest.Mock).mockResolvedValue(mockServiceDetail);
  });

  it("renders all main sections with correct data", async () => {
    // Render the async component
    const { findByTestId } = render(await NicheSolutionsPage());

    // Verify that all sections are rendered
    expect(await findByTestId("service-detail-section")).toHaveTextContent(
      mockServiceDetail.heroTitle
    );
    expect(await findByTestId("why-choose-us")).toBeInTheDocument();
    expect(await findByTestId("four-stage-process")).toBeInTheDocument();
    expect(await findByTestId("our-services-section")).toBeInTheDocument();
    expect(await findByTestId("contact-section")).toBeInTheDocument();
  });
});

describe("generateMetadata", () => {
  beforeEach(() => {
    (getServiceDetailSSG as jest.Mock).mockResolvedValue(mockServiceDetail);
  });

  it("returns the correct metadata object", async () => {
    const metadata = await generateMetadata();

    expect(metadata).toEqual({
      title: `${mockServiceDetail.heroTitle} | AgencyDesk`,
      description: mockServiceDetail.heroSubtitle,
      openGraph: {
        title: mockServiceDetail.heroTitle,
        description: mockServiceDetail.heroSubtitle,
        images: [mockServiceDetail.main_image],
      },
    });
  });

  it("handles missing main_image gracefully", async () => {
    (getServiceDetailSSG as jest.Mock).mockResolvedValue({
      ...mockServiceDetail,
      main_image: null,
    });

    const metadata = await generateMetadata();

    expect(metadata.openGraph?.images).toEqual([]);
  });
});
