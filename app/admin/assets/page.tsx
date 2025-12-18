import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { AssetsList } from "@/components/admin/assets-list";

export default function AssetsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <p className="text-sm text-muted-foreground">
            Manage media assets and their metadata for SEO
          </p>
        </div>
        <Link
          href="/gallery"
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted transition-colors"
        >
          <ImageIcon className="h-4 w-4" />
          View Gallery
        </Link>
      </div>
      <AssetsList />
    </div>
  );
}





