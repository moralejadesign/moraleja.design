import Link from "next/link";
import { Plus } from "lucide-react";
import { ProjectsList } from "@/components/admin/projects-list";

export default function ProjectsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage your portfolio projects
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>
      <ProjectsList />
    </div>
  );
}
