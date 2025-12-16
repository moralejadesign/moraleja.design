"use client";

import { useRouter } from "next/navigation";
import { ImageViewer } from "@/components/image-viewer";

type GalleryAsset = {
  id: number;
  url: string;
  type: string;
  title: string | null;
  description: string | null;
  altText: string | null;
  tags: string[] | null;
  projectId: number | null;
  projectTitle: string | null;
  projectSlug: string | null;
};

interface GalleryPhotoViewProps {
  asset: GalleryAsset;
  assets: GalleryAsset[];
}

export function GalleryPhotoView({ asset, assets }: GalleryPhotoViewProps) {
  const router = useRouter();

  const handleClose = () => {
    router.push("/gallery");
  };

  const handleNavigate = (id: number) => {
    router.replace(`/gallery/photo/${id}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-black">
      <ImageViewer
        asset={asset}
        assets={assets}
        onClose={handleClose}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
