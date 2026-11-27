import type { MetadataRoute } from "next";

const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/inquire",
  "/book",
  "/contact",
  "/careers",
  "/privacy-policy",
  "/terms-of-service",
  "/services/web-and-mobile-development",
  "/services/devops-automation",
  "/services/cloud-hosting",
  "/services/big-data-analytics",
  "/services/content-marketing",
  "/services/cybersecurity",
  "/services/research-development",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://agencydesk-theta.vercel.app").replace(
    /\/$/,
    ""
  );
  const lastModified = new Date("2026-11-27T00:00:00Z");

  return PUBLIC_ROUTES.map((route) => ({
    url: route === "/" ? `${baseUrl}/` : `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === "/" || route === "/inquire" || route === "/book" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route === "/inquire" || route === "/book" ? 0.9 : 0.7,
  }));
}
