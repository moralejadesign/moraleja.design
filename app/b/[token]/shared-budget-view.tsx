"use client";

import { BudgetDocument, type BudgetDocumentData } from "@/components/admin/budget-document";
import { ScaledBudget } from "@/components/budget-viewer";

export function SharedBudgetView({ budget }: { budget: BudgetDocumentData }) {
  return (
    <div className="flex flex-col items-center px-4 py-6 sm:py-10 print:p-0">
      <div className="w-full max-w-[800px] flex justify-center">
        <ScaledBudget>
          <BudgetDocument budget={budget} />
        </ScaledBudget>
      </div>
    </div>
  );
}
