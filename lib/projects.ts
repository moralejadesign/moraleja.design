import { cacheLife, cacheTag } from "next/cache";
import { db, projects, type Project } from "@/db";
import { eq, asc } from "drizzle-orm";

export type { Project } from "@/db";

// Cached until an admin write calls revalidateContent("projects")

export async function getAllProjects(): Promise<Project[]> {
  "use cache";
  cacheLife("max");
  cacheTag("projects");
  return db.select().from(projects).orderBy(asc(projects.position));
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  "use cache";
  cacheLife("max");
  cacheTag("projects");
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);

  return project ?? null;
}

export async function getAllProjectSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("max");
  cacheTag("projects");
  const allProjects = await db
    .select({ slug: projects.slug })
    .from(projects);

  return allProjects.map((p) => p.slug);
}
