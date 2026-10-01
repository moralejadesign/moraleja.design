import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, projects } from "@/db";
import { asc, sql } from "drizzle-orm";
import { revalidateContent } from "@/lib/cache-tags";

export async function GET() {
  try {
    const allProjects = await db
      .select()
      .from(projects)
      .orderBy(asc(projects.position));
    
    return NextResponse.json(allProjects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Get max position to add new project at the end
    const [maxResult] = await db
      .select({ maxPos: sql<number>`COALESCE(MAX(${projects.position}), -1)` })
      .from(projects);
    const nextPosition = (maxResult?.maxPos ?? -1) + 1;
    
    const [newProject] = await db
      .insert(projects)
      .values({
        slug: body.slug,
        title: body.title,
        thumbnail: body.thumbnail,
        heightRatio: body.heightRatio ?? 1.5,
        textContrast: body.textContrast ?? "light",
        blocks: body.blocks ?? [],
        tools: body.tools ?? [],
        background: body.background ?? null,
        tagline: body.tagline ?? null,
        category: body.category ?? null,
        showreelVideo: body.showreelVideo ?? null,
        position: nextPosition,
      })
      .returning();

    revalidateContent("projects");
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
