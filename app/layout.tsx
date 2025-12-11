import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "@/components/Providers"; // ✅ IMPORTANT

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BMSCE . tech",
  description: "Create and manage quick questions for your class",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "BMSCE.tech",
    description: "An Open-Source Community for BMSCE Student",
    url: "https://bmsce.tech",
    siteName: "BMSCE.tech",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "An Open-Source Community for BMSCE Student",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BMSCE.tech",
    description: "An Open-Source Community for BMSCE Student",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        
        {/* 🔥 SESSION PROVIDER FIX */}
        <ClientWrapper>
          {children}
        </ClientWrapper>

        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

/** 🔥 Client boundary so Providers works */
function ClientWrapper({ children }: { children: React.ReactNode }) {
  "use client";
  return <Providers>{children}</Providers>;
}
