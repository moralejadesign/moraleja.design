import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BillingProfileForm } from "@/components/admin/billing-profile-form";

export default function BillingProfilePage() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/budgets/charges" className="p-2 hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing details</h1>
          <p className="text-sm text-muted-foreground">
            Who the cuentas de cobro are payable to. Stored in the database, not in the code.
          </p>
        </div>
      </div>
      <BillingProfileForm />
    </div>
  );
}
