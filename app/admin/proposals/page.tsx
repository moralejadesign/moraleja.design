import Link from "next/link";
import { Plus } from "lucide-react";
import { ProposalsList } from "@/components/admin/proposals-list";

export default function ProposalsAdminPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proposals</h1>
          <p className="text-sm text-muted-foreground">
            Brand presentations clients review and comment on. Only visible here in the admin.
          </p>
        </div>
        <Link
          href="/admin/proposals/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Proposal
        </Link>
      </div>
      <ProposalsList />
    </div>
  );
}
