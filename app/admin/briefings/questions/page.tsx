import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BriefingQuestionLibrary } from "@/components/admin/briefing-question-library";

export default function BriefingQuestionsPage() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/briefings" className="p-2 hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Question Library</h1>
          <p className="text-sm text-muted-foreground">
            Reusable questions in Spanish and English. Editing here doesn&apos;t change briefings already made.
          </p>
        </div>
      </div>
      <BriefingQuestionLibrary />
    </div>
  );
}
