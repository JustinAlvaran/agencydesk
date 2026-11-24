import { fetchSEOData } from "@/utils/seoService";

export async function getSEOMetadata(domain: string, slug: string) {
  try {
    const seo = await fetchSEOData(domain, slug);

    if (!seo) {
      return {
        title: "CITC",
        description: "Default description",
      };
    }

    const title = seo.meta_title || seo.website.default_meta_title;
    const description = seo.meta_description || seo.website.default_meta_description;
    const ogImage = seo.og_image || seo.website.default_og_image;

    return {
      title,
      description,
      alternates: {
        canonical: seo.canonical_url || undefined,
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
      title: "CITC",
      description: "Default description",
    };
  }
}
