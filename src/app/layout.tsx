import type { Metadata } from "next";
import { websiteContent, websiteContentDigest } from "@/lib/website-content";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: websiteContent.site_settings.seo_title, template: "%s · AgencyDesk" },
  description: websiteContent.site_settings.seo_description,
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  other: { 'website-content-digest': websiteContentDigest },

};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full"><a className="skip-link" href="#main-content">Skip to content</a>{children}</body>
    </html>
  );
}

