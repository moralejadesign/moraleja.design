import { Metadata } from "next";
import { WrappedPageContent } from "@/components/wrapped/wrapped-page-content";
import type { WrappedData } from "@/components/wrapped";
import wrappedData from "@/data/wrapped-2025.json";

const data = wrappedData as WrappedData;

export const metadata: Metadata = {
  title: `${data.year} Wrapped`,
  description: `${data.studio.name}'s year in review - ${data.metrics.totalProjects} projects, ${data.metrics.totalAssets} creative assets, and more.`,
  openGraph: {
    title: `${data.studio.name} ${data.year} Wrapped`,
    description: `Our creative journey through ${data.year}. ${data.metrics.totalProjects} projects crafted, ${data.metrics.totalAssets} assets created.`,
    type: "website",
    images: ["/brand_assets/MORALEJA_OG.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${data.studio.name} ${data.year} Wrapped`,
    description: `Our creative journey through ${data.year}.`,
    images: ["/brand_assets/MORALEJA_OG.png"],
  },
};

export default function Wrapped2025Page() {
  return <WrappedPageContent data={data} />;
}
