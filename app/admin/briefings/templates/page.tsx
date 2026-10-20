import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BriefingTemplates } from "@/components/admin/briefing-templates";

export default function BriefingTemplatesPage() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/briefings" className="p-2 hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Sets of library questions to start a briefing from. A template works in Spanish and English.
          </p>
        </div>
      </div>
      <BriefingTemplates />
    </div>
  );
}
