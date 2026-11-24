import type { NextConfig } from "next"; 

const nextConfig: NextConfig = { 
  // Authenticated pages and API routes require the Next.js server runtime.
  // Preserve the frontend's existing image rendering.
  images: { unoptimized: true, }, 
  // Remove console.log in production 
  compiler: { removeConsole: process.env.NODE_ENV === "production", }, 
  // Preserve the supplied frontend's URL convention.
  trailingSlash: true, 
  // Ensure proper asset handling 
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.ASSET_PREFIX || '' : '', 
}; 
export default nextConfig;
