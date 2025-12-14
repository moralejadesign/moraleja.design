import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { ThemeProvider } from "@/providers/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light dark",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://moraleja.co"),
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
    url: "https://moraleja.co",
    siteName: "Moraleja Design",
    title: "Moraleja Design",
    description: "Creative studio shaping brands, visuals, and experiences.",
    images: [
      {
        url: "/brand_assets/MORALEJA_OG.png",
        width: 1024,
        height: 538,
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
