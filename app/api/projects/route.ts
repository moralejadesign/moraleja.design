import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, projects } from "@/db";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allProjects = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));
    
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
    
    const [newProject] = await db
      .insert(projects)
      .values({
        slug: body.slug,
        title: body.title,
        thumbnail: body.thumbnail,
        heightRatio: body.heightRatio ?? 1.5,
        textContrast: body.textContrast ?? "light",
        blocks: body.blocks ?? [],
      })
      .returning();

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
