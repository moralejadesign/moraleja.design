import { upload } from "@vercel/blob/client";
import type { ProposalSlide } from "@/db/schema";
import { PROPOSAL_IMAGE_TYPES, SLIDE_RENDER_MAX_PX } from "./proposals";
import { newSectionId } from "./budgets";

// Browser-only: turns the files you pick into slide images in the Blob store.
// A PDF is rendered page by page with pdf.js, so the design (vectors, fonts,
// gradients) comes out exactly as exported; images are uploaded untouched.

export type SlideProgress = { file: string; page: number; pages: number };

const safeName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 60) || "slide";

async function uploadImage(blob: Blob, pathname: string) {
  const result = await upload(pathname, blob, {
    access: "public",
    handleUploadUrl: "/api/proposals/upload",
    contentType: blob.type,
  });
  return result.url;
}

async function* pdfPages(file: File) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

  const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const pdf = await task.promise;
  try {
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const base = page.getViewport({ scale: 1 });
      // Long side at SLIDE_RENDER_MAX_PX, never below 2x for small pages
      const scale = Math.max(2, SLIDE_RENDER_MAX_PX / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale: Math.min(scale, 6) });

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      await page.render({ canvas, viewport }).promise;

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't render page"))), "image/webp", 0.92)
      );
      page.cleanup();
      yield { blob, width: canvas.width, height: canvas.height, page: n, pages: pdf.numPages };
      canvas.width = canvas.height = 0;
    }
  } finally {
    await task.destroy();
  }
}

/**
 * Uploads the files in order, calling `onSlide` as each slide is ready so the
 * editor can show (and save) them while the rest are still processing.
 */
export async function filesToSlides(
  files: File[],
  onSlide: (slide: ProposalSlide) => void,
  onProgress: (progress: SlideProgress) => void
) {
  for (const file of files) {
    const name = safeName(file.name);
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      for await (const page of pdfPages(file)) {
        onProgress({ file: file.name, page: page.page, pages: page.pages });
        const url = await uploadImage(page.blob, `proposals/${name}-p${page.page}.webp`);
        onSlide({ id: newSectionId(), url, width: page.width, height: page.height, title: "" });
      }
    } else if (PROPOSAL_IMAGE_TYPES.includes(file.type)) {
      onProgress({ file: file.name, page: 1, pages: 1 });
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      bitmap.close();
      const url = await uploadImage(file, `proposals/${name}.${file.type.split("/")[1]}`);
      onSlide({ id: newSectionId(), url, width, height, title: "" });
    } else {
      throw new Error(`${file.name} isn't a PDF, PNG, JPG or WebP`);
    }
  }
}
