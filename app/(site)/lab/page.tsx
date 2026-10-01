import { Metadata } from "next";
import { Suspense } from "react";
import { PageIntro } from "@/components/page-intro";
import { LabGrid } from "@/components/lab-grid";
import { db } from "@/db";
import { labProjects } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

export const metadata: Metadata = {
  title: "Lab",
  description: "Experiments and projects built with AI tools like v0, Cursor, Claude Code, Midjourney, and more.",
};

async function getLabProjects() {
  "use cache";
  cacheLife("max");
  cacheTag("lab");
  return db
    .select()
    .from(labProjects)
    .where(eq(labProjects.isPublished, true))
    .orderBy(asc(labProjects.position), desc(labProjects.createdAt));
}

async function getAllTags() {
  "use cache";
  cacheLife("max");
  cacheTag("lab");
  const result = await db
    .select({ tags: labProjects.tags })
    .from(labProjects)
    .where(eq(labProjects.isPublished, true));

  const allTags = new Set<string>();
  result.forEach((row) => {
    row.tags?.forEach((tag) => allTags.add(tag));
  });

  return Array.from(allTags).sort();
}

export default async function LabPage() {
  const [items, allTags] = await Promise.all([getLabProjects(), getAllTags()]);

  return (
    <>
      <PageIntro name="Lab" statement="is where we experiment." lede="Code and creative experiments made with AI tools." />
      <Suspense fallback={<div className="text-muted-foreground">Loading lab...</div>}>
        <LabGrid items={items} availableTags={allTags} />
      </Suspense>
    </>
  );
}
