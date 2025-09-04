import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Bona - Collaborative Media Asset Management",
  description:
    "Streamline media asset sharing and team collaboration for creative professionals",
  openGraph: {
    title: "Bona — Collaborative Media Asset Management",
    description:
      "Streamline media asset sharing and team collaboration for creative professionals.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://bona.app",
    siteName: "Bona",
    images: [
      {
        url: "/professional-entrepreneur.png",
        width: 1200,
        height: 630,
        alt: "Bona preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bona — Collaborative Media Asset Management",
    description:
      "Streamline media asset sharing and team collaboration for creative professionals.",
    images: [
      process.env.NEXT_PUBLIC_TWITTER_IMAGE_URL ||
        "/professional-entrepreneur.png",
    ],
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
        className={`${outfit.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <Providers>
          <ThemeProvider>
            {children}
            <Toaster position="top-right" />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}