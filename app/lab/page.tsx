import { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { LabGrid } from "@/components/lab-grid";
import { db } from "@/db";
import { labProjects } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lab",
  description: "Experiments and projects built with AI tools like v0, Cursor, Claude Code, Midjourney, and more.",
};

async function getLabProjects() {
  return db
    .select()
    .from(labProjects)
    .where(eq(labProjects.isPublished, true))
    .orderBy(asc(labProjects.position), desc(labProjects.createdAt));
}

async function getAllTags() {
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
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background pt-16 md:pt-20">
        <div className="w-full px-3 py-8 md:px-8 md:py-12 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Lab</h1>
              <p className="text-muted-foreground">
                Experiments with AI tools — code and creative
              </p>
            </div>
            <Suspense fallback={<div className="text-muted-foreground">Loading lab...</div>}>
              <LabGrid items={items} availableTags={allTags} />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
