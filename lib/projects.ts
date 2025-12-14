import projectsData from "@/data/projects.json"
import { ProjectsSchema, type Project } from "./types"

const validatedProjects = ProjectsSchema.parse(projectsData)

export const projects: Project[] = validatedProjects

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug)
}

export function getAllProjectSlugs(): string[] {
  return projects.map((project) => project.slug)
}

