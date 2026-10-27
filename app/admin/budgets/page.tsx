import Link from "next/link";
import { Plus, Library, ReceiptText } from "lucide-react";
import { BudgetsList } from "@/components/admin/budgets-list";

export default function BudgetsAdminPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Private client budgets. Only visible here in the admin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/budgets/charges"
            className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted transition-colors"
          >
            <ReceiptText className="h-4 w-4" />
            Cuentas de cobro
          </Link>
          <Link
            href="/admin/budgets/phases"
            className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted transition-colors"
          >
            <Library className="h-4 w-4" />
            Phase Library
          </Link>
          <Link
            href="/admin/budgets/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Budget
          </Link>
        </div>
      </div>
      <BudgetsList />
    </div>
  );
}
