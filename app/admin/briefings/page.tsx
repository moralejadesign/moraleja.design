import Link from "next/link";
import { Plus, Library, LayoutTemplate } from "lucide-react";
import { BriefingsList } from "@/components/admin/briefings-list";

export default function BriefingsAdminPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Briefings</h1>
          <p className="text-sm text-muted-foreground">
            Questionnaires clients answer before branding work. Only visible here in the admin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/briefings/templates"
            className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted transition-colors"
          >
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </Link>
          <Link
            href="/admin/briefings/questions"
            className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted transition-colors"
          >
            <Library className="h-4 w-4" />
            Question Library
          </Link>
          <Link
            href="/admin/briefings/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Briefing
          </Link>
        </div>
      </div>
      <BriefingsList />
    </div>
  );
}
