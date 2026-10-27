"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ChargeEditor } from "@/components/admin/charge-editor";
import type { ChargeAccount } from "@/db/schema";

async function fetchCharge(id: string): Promise<ChargeAccount> {
  const res = await fetch(`/api/charges/${id}`);
  if (!res.ok) throw new Error("Failed to fetch charge account");
  return res.json();
}

export default function EditChargePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: charge, isLoading, error } = useQuery({
    queryKey: ["charge", id],
    queryFn: () => fetchCharge(id),
    // The editor keeps its own state and writes saves back into this cache
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !charge) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Cuenta de cobro not found</p>
      </div>
    );
  }

  return <ChargeEditor key={charge.id} charge={charge} />;
}
