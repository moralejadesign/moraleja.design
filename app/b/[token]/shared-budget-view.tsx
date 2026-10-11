"use client";

import { useRef } from "react";
import { FileDown } from "lucide-react";
import { BudgetDocument, type BudgetDocumentData } from "@/components/admin/budget-document";
import { ScaledBudget, printBudgetDocument } from "@/components/budget-viewer";

export function SharedBudgetView({
  budget,
  fileName,
}: {
  budget: BudgetDocumentData;
  fileName: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col items-center px-4 py-6 sm:py-10 print:p-0">
      <div className="w-full max-w-[800px] flex justify-end mb-4 print:hidden">
        <button
          type="button"
          onClick={() => printBudgetDocument(ref.current, fileName)}
          className="inline-flex items-center gap-2 border border-white/25 px-4 py-2 text-[11px] uppercase tracking-[0.25em] hover:bg-white hover:text-black transition-colors"
        >
          <FileDown className="h-4 w-4" />
          {budget.language === "es" ? "Descargar PDF" : "Download PDF"}
        </button>
      </div>
      <div ref={ref} className="w-full max-w-[800px] flex justify-center">
        <ScaledBudget>
          <BudgetDocument budget={budget} />
        </ScaledBudget>
      </div>
    </div>
  );
}
