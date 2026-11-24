import type { Metadata } from "next";
import { Montserrat, Lato } from "next/font/google";
import "./globals.css";
import Footer from "@/components/navigation/footer";
import { quicklinks } from "@/constant/quicklinks";
import { services } from "@/constant/services";
import { contacts } from "@/constant/contacts";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import ScrollToTop from "@/components/ui/scroll-to-top";
import Header from "@/components/navigation/header";
import AgencyBot from "@/components/chatbot/agency-bot";
import type { Viewport } from 'next';

const montserrat = Montserrat({
  weight: ["700", "500", "400"],
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const lato = Lato({
  weight: ["300", "400", "700", "900"],
  style: ["normal"],
  variable: "--font-lato",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgencyDesk · Modern Agency CRM & Client Workspace",
  description: "Capture client inquiries, publish versioned proposals, track project milestones, and automate team delivery with complete transparency.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-visual',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${lato.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Header />
          <div className="pt-20">
            {children}
          </div>
          <ScrollToTop />
          <AgencyBot />
          <Footer quicklinks={quicklinks} services={services} contacts={contacts} />
        </ThemeProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
