import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import Footer from "@/components/common/footer";
import Navbar from "@/components/common/navbar";

import ProgessProvider from "@/components/providers/progess-provider";
import TanstackQueryProvider from "@/components/providers/tanstack-query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

import "./globals.css";

const serif = Instrument_Serif({
  variable: "--font-serif",
  weight: ["400"],
  style: ["normal", "italic"],
});

const sans = DM_Sans({
  variable: "--font-sans",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "BMSCE .tech",
  description:
    "An Open Source Community for BMSCE Students. Explore projects, collaborate, and contribute to the vibrant tech ecosystem at BMSCE.",
  icons: {
    icon: "/bmsce.svg",
  },
  openGraph: {
    title: "BMSCE .tech",
    description:
      "An Open Source Community for BMSCE Students. Explore projects, collaborate, and contribute to the vibrant tech ecosystem at BMSCE.",
    siteName: "bmsce.tech",
    images: [
      {
        url: "/preview-temp.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BMSCE .tech",
    description:
      "An Open Source Community for BMSCE Students. Explore projects, collaborate, and contribute to the vibrant tech ecosystem at BMSCE.",
    images: ["/preview-temp.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${serif.variable} ${sans.variable} antialiased ${mono.variable}`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TanstackQueryProvider>
            <ProgessProvider>
              <Navbar />
              {children}
              <Footer />
              <Toaster />
            </ProgessProvider>
          </TanstackQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
