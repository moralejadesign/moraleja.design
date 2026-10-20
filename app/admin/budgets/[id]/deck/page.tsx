import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { budgets, projects } from "@/db/schema";
import { getAdminUserId } from "@/lib/admin-auth";
import { BudgetDeck, type DeckProject } from "@/components/admin/budget-deck";

export const metadata: Metadata = {
  title: "Presentación",
};

// Shown in this order on the "selected work" slides.
// extra: case-study images next to the thumbnail; fit "contain" shows each image whole.
// photosOnly skips PNGs, which are often cut-outs that leave empty space.
const SHOWCASE: { slug: string; extra: number; fit: DeckProject["fit"]; photosOnly?: boolean }[] = [
  { slug: "croma-branding", extra: 4, fit: "contain" },
  { slug: "code-brew-el-salvador", extra: 2, fit: "cover", photosOnly: true },
  { slug: "kebo", extra: 2, fit: "contain", photosOnly: true },
  { slug: "she-ships", extra: 2, fit: "contain", photosOnly: true },
];

export default function BudgetDeckPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[100] bg-[#0a0a0a]" />}>
      <Deck params={params} />
    </Suspense>
  );
}

async function Deck({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUserId())) notFound();

  const { id } = await params;
  const [budget] = await db.select().from(budgets).where(eq(budgets.id, parseInt(id, 10)));
  if (!budget) notFound();

  const rows = await db.select().from(projects).where(inArray(
    projects.slug,
    SHOWCASE.map((s) => s.slug)
  ));
  const showcase = SHOWCASE.flatMap((options) => {
    const project = rows.find((p) => p.slug === options.slug);
    return project ? [toDeckProject(project, options)] : [];
  });

  // Only what the slides show; prices and internal notes stay on the server
  return (
    <BudgetDeck
      budget={{
        id: budget.id,
        clientName: budget.clientName,
        language: budget.language,
        issueDate: budget.issueDate,
        sections: budget.sections.map((s) => ({ ...s, price: null })),
        advancePercent: budget.advancePercent,
        validDays: budget.validDays,
        conditions: budget.conditions,
      }}
      projects={showcase}
    />
  );
}

/** Thumbnail plus a few more images from the case study. */
function toDeckProject(
  project: typeof projects.$inferSelect,
  options: (typeof SHOWCASE)[number]
): DeckProject {
  const images = project.blocks.flatMap((block) => {
    if (block.type === "full-image") return [block.url];
    if (block.type === "two-column") return [block.left, block.right];
    return [];
  });
  const pattern = options.photosOnly ? /\.(jpe?g|webp)$/i : /\.(jpe?g|png|webp|gif)$/i;
  const extra = images.filter((url) => url && url !== project.thumbnail && pattern.test(url));

  return {
    slug: project.slug,
    title: project.title,
    category: project.category ?? "",
    images: [project.thumbnail, ...extra.slice(0, options.extra)],
    fit: options.fit,
  };
}
