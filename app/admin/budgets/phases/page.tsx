import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BudgetPhaseLibrary } from "@/components/admin/budget-phase-library";

export default function BudgetPhasesPage() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/budgets" className="p-2 hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Phase Library</h1>
          <p className="text-sm text-muted-foreground">
            Reusable phases in Spanish and English. Editing here doesn&apos;t change budgets already made.
          </p>
        </div>
      </div>
      <BudgetPhaseLibrary />
    </div>
  );
}
