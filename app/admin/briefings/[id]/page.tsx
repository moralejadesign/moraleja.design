"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { BriefingEditor } from "@/components/admin/briefing-editor";
import type { Briefing } from "@/db/schema";

async function fetchBriefing(id: string): Promise<Briefing> {
  const res = await fetch(`/api/briefings/${id}`);
  if (!res.ok) throw new Error("Failed to fetch briefing");
  return res.json();
}

export default function EditBriefingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: briefing, isLoading, error } = useQuery({
    queryKey: ["briefing", id],
    queryFn: () => fetchBriefing(id),
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

  if (error || !briefing) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Briefing not found</p>
      </div>
    );
  }

  return <BriefingEditor key={briefing.id} briefing={briefing} />;
}
