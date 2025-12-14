import { db, projects, type Project } from "@/db";
import { eq, asc } from "drizzle-orm";

export type { Project } from "@/db";

export async function getAllProjects(): Promise<Project[]> {
  return db.select().from(projects).orderBy(asc(projects.position));
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);
  
  return project ?? null;
}

export async function getAllProjectSlugs(): Promise<string[]> {
  const allProjects = await db
    .select({ slug: projects.slug })
    .from(projects);
  
  return allProjects.map((p) => p.slug);
}
