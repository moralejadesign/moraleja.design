import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";
import { ChargesList } from "@/components/admin/charges-list";

export default function ChargesAdminPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/budgets" className="p-2 hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cuentas de cobro</h1>
            <p className="text-sm text-muted-foreground">
              Payment requests to clients, numbered in sequence. Made from a budget or on their own.
            </p>
          </div>
        </div>
        <Link
          href="/admin/budgets/charges/profile"
          className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted transition-colors"
        >
          <UserRound className="h-4 w-4" />
          Billing details
        </Link>
      </div>
      <ChargesList />
    </div>
  );
}
