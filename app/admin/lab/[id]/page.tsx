"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { LabForm } from "@/components/admin/lab-form";
import type { LabProject } from "@/db/schema";

async function fetchLabProject(id: string): Promise<LabProject> {
  const res = await fetch(`/api/lab/${id}`);
  if (!res.ok) throw new Error("Failed to fetch lab project");
  return res.json();
}

export default function EditLabProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: item, isLoading, error } = useQuery({
    queryKey: ["lab-project", id],
    queryFn: () => fetchLabProject(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Lab project not found</p>
      </div>
    );
  }

  return <LabForm item={item} />;
}
