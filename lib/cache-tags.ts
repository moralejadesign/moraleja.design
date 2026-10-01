import { revalidateTag } from "next/cache";

/** Cache tags for public pages; each admin write expires the matching tag. */
export type ContentTag = "projects" | "assets" | "lab" | "products";

/** Expires immediately so the next visit shows the saved change. */
export function revalidateContent(...tags: ContentTag[]) {
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
}
