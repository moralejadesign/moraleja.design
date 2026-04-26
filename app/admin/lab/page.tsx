import Link from "next/link";
import { Plus, FlaskConical } from "lucide-react";
import { LabList } from "@/components/admin/lab-list";

export default function LabAdminPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lab Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage experiments with AI coding and creative tools
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/lab"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted transition-colors"
          >
            <FlaskConical className="h-4 w-4" />
            View Lab
          </Link>
          <Link
            href="/admin/lab/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </div>
      </div>
      <LabList />
    </div>
  );
}
