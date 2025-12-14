import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { FolderOpen, Settings, BarChart3 } from "lucide-react";

export default async function AdminPage() {
  const { userId } = await auth();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Welcome back! Manage your portfolio content.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/projects"
          className="group p-6 border border-border hover:border-foreground/30 transition-colors"
        >
          <FolderOpen className="h-8 w-8 mb-3 text-muted-foreground group-hover:text-foreground transition-colors" />
          <h2 className="font-semibold mb-1">Projects</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage portfolio projects
          </p>
        </Link>

        <div className="p-6 border border-border opacity-50 cursor-not-allowed">
          <Settings className="h-8 w-8 mb-3 text-muted-foreground" />
          <h2 className="font-semibold mb-1">Settings</h2>
          <p className="text-sm text-muted-foreground">Coming soon</p>
        </div>

        <div className="p-6 border border-border opacity-50 cursor-not-allowed">
          <BarChart3 className="h-8 w-8 mb-3 text-muted-foreground" />
          <h2 className="font-semibold mb-1">Analytics</h2>
          <p className="text-sm text-muted-foreground">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
