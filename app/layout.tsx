import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { ThemeProvider } from "@/providers/theme";
import { QueryProvider } from "@/providers/query";
import { config } from "@/lib/config";

const monoblock = localFont({
  src: [
    { path: "./fonts/monoblock/Monoblock-Thin.otf", weight: "100", style: "normal" },
    { path: "./fonts/monoblock/Monoblock-ExtraLight.otf", weight: "200", style: "normal" },
    { path: "./fonts/monoblock/Monoblock-Light.otf", weight: "300", style: "normal" },
    { path: "./fonts/monoblock/Monoblock-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/monoblock/Monoblock-Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/monoblock/Monoblock-SemiBold.otf", weight: "600", style: "normal" },
    { path: "./fonts/monoblock/Monoblock-Bold.otf", weight: "700", style: "normal" },
    { path: "./fonts/monoblock/Monoblock-ExtraBold.otf", weight: "800", style: "normal" },
    { path: "./fonts/monoblock/Monoblock-Black.otf", weight: "900", style: "normal" },
  ],
  variable: "--font-monoblock",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light dark",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://moraleja.design"),
  title: {
    default: "Moraleja Design",
    template: "%s | Moraleja Design",
  },
  description: "Creative studio shaping brands, visuals, and experiences.",
  keywords: ["design", "branding", "creative studio", "visual design", "moraleja"],
  authors: [{ name: "Moraleja Design" }],
  creator: "Moraleja Design",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://moraleja.design",
    siteName: "Moraleja Design",
    title: "Moraleja Design",
    description: "Creative studio shaping brands, visuals, and experiences.",
    images: [
      {
        url: "/brand_assets/MORALEJA_OG.jpg",
        width: 1200,
        height: 630,
        alt: "Moraleja Design",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Moraleja Design",
    description: "Creative studio shaping brands, visuals, and experiences.",
    images: ["/brand_assets/MORALEJA_OG.png"],
    creator: "@moralejadesign",
  },
  icons: {
    icon: "/brand_assets/MORALEJA_FAVICON.png",
    apple: "/brand_assets/MORALEJA_FAVICON.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <ThemeScript />
          {/* Preconnect to image CDN for faster loading */}
          <link
            rel="preconnect"
            href={config.blobBaseUrl}
            crossOrigin="anonymous"
          />
          <link
            rel="dns-prefetch"
            href={config.blobBaseUrl}
          />
        </head>
        <body
          className={`${monoblock.variable} antialiased`}
        >
          <ThemeProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </ThemeProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
