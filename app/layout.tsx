import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { config } from "@/lib/config";

const monoblock = localFont({
  src: [
    { path: "./fonts/monoblock/Monoblock-ExtraLight.woff2", weight: "200", style: "normal" },
    { path: "./fonts/monoblock/Monoblock-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/monoblock/Monoblock-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/monoblock/Monoblock-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/monoblock/Monoblock-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/monoblock/Monoblock-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-monoblock",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
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
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <head>
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
