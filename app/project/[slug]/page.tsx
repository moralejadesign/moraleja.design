import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProjectDetail } from "@/components/project-detail"
import { RelatedProjects } from "@/components/related-projects"
import { getAllProjects, getProjectBySlug, type Project } from "@/lib/projects"

export const dynamic = "force-dynamic"

const RELATED_COUNT = 3

function pickRandom(items: Project[], count: number): Project[] {
  const pool = [...items]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  const allProjects = await getAllProjects()
  const otherProjects = allProjects.filter((p) => p.id !== project.id)
  const relatedProjects = pickRandom(otherProjects, RELATED_COUNT)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background pt-16 md:pt-20">
        <ProjectDetail project={project} />
        <RelatedProjects projects={relatedProjects} />
      </main>
      <Footer />
    </div>
  )
}
