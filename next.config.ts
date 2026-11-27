import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Authenticated pages and API routes require the Next.js server runtime.
  // Preserve the frontend's existing image rendering.
  images: { unoptimized: true },
  // Remove console.log in production
  compiler: { removeConsole: process.env.NODE_ENV === "production" },
  // Preserve the supplied frontend's URL convention.
  trailingSlash: true,
  // Ensure proper asset handling
  assetPrefix: process.env.NODE_ENV === "production" ? process.env.ASSET_PREFIX || "" : "",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
