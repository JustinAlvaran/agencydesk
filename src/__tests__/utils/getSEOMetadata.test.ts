import { getSEOMetadata } from "@/utils/seoMetadata";
import { fetchSEOData } from "@/utils/seoService";

jest.mock("@/utils/seoService", () => ({
  ...jest.requireActual("@/utils/seoService"),
  fetchSEOData: jest.fn(),
}));

const mockedFetchSEOData = fetchSEOData as jest.Mock;

describe("getSEOMetadata", () => {
  const domain = "example.com";
  const slug = "home";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return default metadata if fetchSEOData returns null", async () => {
    mockedFetchSEOData.mockResolvedValueOnce(null);

    const result = await getSEOMetadata(domain, slug);

    expect(result).toMatchObject({
      title: "AgencyDesk · Modern Agency CRM & Client Workspace",
      description:
        "Capture client inquiries, publish versioned proposals, track project milestones, and automate team delivery with complete transparency.",
    });
  });

  it("should return SEO metadata if available", async () => {
    mockedFetchSEOData.mockResolvedValueOnce({
      meta_title: "Custom Title",
      meta_description: "Custom Description",
      og_image: "/custom-og.webp",
      canonical_url: "https://example.com/home",
      og_title: "Custom OG Title",
      og_description: "Custom OG Description",
      twitter_card: "summary_large_image",
      website: {
        default_meta_title: "Default Site Title",
        default_meta_description: "Default Site Description",
        default_og_image: "/default-og.webp",
      },
    });

    const result = await getSEOMetadata(domain, slug);

    expect(result.title).toBe("Custom Title");
    expect(result.description).toBe("Custom Description");
    expect(result.alternates?.canonical).toBe("https://example.com/home");
    expect(result.openGraph?.images).toEqual(["/custom-og.webp"]);
    expect(result.twitter?.card).toBe("summary_large_image");
  });

  it("should fallback to website defaults if specific fields are missing", async () => {
    mockedFetchSEOData.mockResolvedValueOnce({
      meta_title: null,
      meta_description: null,
      og_image: null,
      canonical_url: null,
      og_title: null,
      og_description: null,
      twitter_card: null,
      website: {
        default_meta_title: "Fallback Title",
        default_meta_description: "Fallback Description",
        default_og_image: "/fallback-og.webp",
      },
    });

    const result = await getSEOMetadata(domain, slug);

    expect(result.title).toBe("Fallback Title");
    expect(result.description).toBe("Fallback Description");
    expect(result.openGraph?.images).toEqual(["/fallback-og.webp"]);
    expect(result.twitter?.card).toBe("summary");
  });

  it("should handle fetchSEOData throwing an error", async () => {
    mockedFetchSEOData.mockRejectedValueOnce(new Error("Network error"));

    const result = await getSEOMetadata(domain, slug);

    expect(result).toMatchObject({
      title: "AgencyDesk · Modern Agency CRM & Client Workspace",
      description:
        "Capture client inquiries, publish versioned proposals, track project milestones, and automate team delivery with complete transparency.",
    });
  });
});
