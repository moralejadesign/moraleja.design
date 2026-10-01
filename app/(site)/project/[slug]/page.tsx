import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ProjectDetail } from "@/components/project-detail"
import { RelatedProjects } from "@/components/related-projects"
import { getAllProjects, getAllProjectSlugs, getProjectBySlug, type Project } from "@/lib/projects"

const RELATED_COUNT = 4

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const slugs = await getAllProjectSlugs()
  return slugs.map((slug) => ({ slug }))
}

/** The projects that follow this one in portfolio order, wrapping around. */
function nextProjects(all: Project[], current: Project, count: number): Project[] {
  const index = all.findIndex((p) => p.id === current.id)
  const rest = [...all.slice(index + 1), ...all.slice(0, index)]
  return rest.slice(0, count)
}

async function ProjectContent({ params }: Params) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  const allProjects = await getAllProjects()

  return (
    <>
      <ProjectDetail project={project} />
      <RelatedProjects projects={nextProjects(allProjects, project, RELATED_COUNT)} />
    </>
  )
}

export default function ProjectPage({ params }: Params) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <ProjectContent params={params} />
    </Suspense>
  )
}
