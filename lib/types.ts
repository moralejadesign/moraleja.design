import { z } from "zod"

const ImagePathSchema = z.string().refine(
  (val) => val.startsWith("/") || val.startsWith("http://") || val.startsWith("https://"),
  {
    message: "Must be a file path (starting with /) or a valid URL",
  }
)

export const ProjectContentSchema = z.object({
  description: z.string().min(1, "Description is required"),
  text: z.string().min(1, "Text is required"),
})

export const ProjectSchema = z.object({
  id: z.number(),
  slug: z.string().min(1, "Slug is required"),
  title: z.string().min(1, "Title is required"),
  thumbnail: ImagePathSchema,
  heightRatio: z.number().min(0.1).max(3),
  images: z.array(ImagePathSchema).min(1, "At least one image is required"),
  content: ProjectContentSchema,
})

export const ProjectFormSchema = ProjectSchema.omit({ id: true })

export const ProjectsSchema = z.array(ProjectSchema)

export type ProjectContent = z.infer<typeof ProjectContentSchema>
export type Project = z.infer<typeof ProjectSchema>
export type ProjectForm = z.infer<typeof ProjectFormSchema>

