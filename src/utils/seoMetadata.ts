import { fetchSEOData } from "@/utils/seoService";

const DEFAULT_TITLE = "AgencyDesk · Modern Agency CRM & Client Workspace";
const DEFAULT_DESCRIPTION =
  "Capture client inquiries, publish versioned proposals, track project milestones, and automate team delivery with complete transparency.";

const SLUG_LABELS: Record<string, { title: string; description: string }> = {
  "/privacy-policy": {
    title: "Privacy Policy · AgencyDesk",
    description:
      "Learn how AgencyDesk protects inquiry records, WhatsApp and email consent preferences, and client portal data.",
  },
  "/terms-of-service": {
    title: "Terms of Service · AgencyDesk",
    description:
      "Review AgencyDesk engagement terms, proposal approvals, client portal usage, and intellectual property terms.",
  },
  "/book": {
    title: "Schedule Discovery Call · AgencyDesk",
    description:
      "Book a 20-minute discovery call to scope your next web, CRM, or workflow automation build.",
  },
  "/inquire": {
    title: "Start Project Inquiry · AgencyDesk",
    description:
      "Share your target timeline, budget, and scope requirements for a fixed-price proposal within 48 hours.",
  },
};

export async function getSEOMetadata(domain: string, slug: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://agencydesk-theta.vercel.app").replace(
    /\/$/,
    ""
  );
  const slugDefaults = SLUG_LABELS[slug];
  const fallbackTitle = slugDefaults?.title ?? DEFAULT_TITLE;
  const fallbackDescription = slugDefaults?.description ?? DEFAULT_DESCRIPTION;

  try {
    const seo = await fetchSEOData(domain, slug);

    if (!seo) {
      return {
        title: fallbackTitle,
        description: fallbackDescription,
        alternates: {
          canonical: `${baseUrl}${slug.startsWith("/") ? slug : `/${slug}`}`,
        },
        openGraph: {
          title: fallbackTitle,
          description: fallbackDescription,
          type: "website",
        },
      };
    }

    const title = seo.meta_title || seo.website.default_meta_title || fallbackTitle;
    const description =
      seo.meta_description || seo.website.default_meta_description || fallbackDescription;
    const ogImage = seo.og_image || seo.website.default_og_image;

    return {
      title,
      description,
      alternates: {
        canonical: seo.canonical_url || `${baseUrl}${slug.startsWith("/") ? slug : `/${slug}`}`,
      },
      openGraph: {
        title: seo.og_title || title,
        description: seo.og_description || description,
        images: ogImage ? [ogImage] : [],
        type: "website",
      },
      twitter: {
        card: seo.twitter_card || "summary",
        title: seo.og_title || title,
        description: seo.og_description || description,
        images: ogImage ? [ogImage] : [],
      },
    };
  } catch (error) {
    console.error("getSEOMetadata error:", error);
    return {
      title: fallbackTitle,
      description: fallbackDescription,
    };
  }
}
