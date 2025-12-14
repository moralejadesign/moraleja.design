"use client"

import { useForm } from "react-hook-form"
import { ProjectFormSchema, type ProjectForm } from "@/lib/types"
import { createFormConfig } from "@/lib/form-helpers"

export function ProjectFormExample() {
  const form = useForm<ProjectForm>({
    ...createFormConfig(ProjectFormSchema),
    defaultValues: {
      slug: "",
      title: "",
      thumbnail: "",
      heightRatio: 1.0,
      images: [""],
      content: {
        description: "",
        text: "",
      },
    },
  })

  const onSubmit = (data: ProjectForm) => {
    console.log("Validated form data:", data)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-foreground">Title</label>
        <input 
          id="title" 
          {...form.register("title")} 
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="slug" className="text-sm font-medium text-foreground">Slug</label>
        <input 
          id="slug" 
          {...form.register("slug")} 
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {form.formState.errors.slug && (
          <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-foreground">Description</label>
        <textarea 
          id="description" 
          {...form.register("content.description")} 
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-24"
        />
        {form.formState.errors.content?.description && (
          <p className="text-sm text-destructive">{form.formState.errors.content.description.message}</p>
        )}
      </div>

      <button 
        type="submit"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Submit
      </button>
    </form>
  )
}

